import React, { useState, useEffect, useRef } from 'react';
import './ContentTypeN.css';
import {
  FaPlay,
  FaPause,
  FaRegClock,
  FaCheck,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaStopwatch,
} from 'react-icons/fa';
import { useNotification } from '../../../../app/providers/NotificationProvider';

const defaultTasks = [];

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v, i) => (i === 0 ? v : String(v).padStart(2, '0'))).join(':');
};

const ContentTypeN = ({ data, onUpdate }) => {
  const [tasks, setTasks] = useState(data?.node?.content?.tasks || defaultTasks);
  const [newTitle, setNewTitle] = useState('');
  const [newEstimate, setNewEstimate] = useState('');
  const timerRefs = useRef({});
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const { showNotification } = useNotification();

  // Сохраняем задачи в data
  useEffect(() => {
    if (data && data.node) {
      onUpdate({
        ...data,
        node: {
          ...data.node,
          content: {
            ...data.node.content,
            tasks,
          },
        },
      });
    }
    // eslint-disable-next-line
  }, [tasks]);

  // Получить оставшееся время для countdown
  const getCountdownLeft = (task) => {
    if (task.timerRunning && task.startedAt) {
      const now = Date.now();
      const elapsed = Math.floor((now - task.startedAt) / 1000);
      return Math.max(task.estimateMinutes * 60 - (task.spentSeconds + elapsed), 0);
    }
    return Math.max(task.estimateMinutes * 60 - (task.spentSeconds || 0), 0);
  };

  // Получить прошедшее время для timer
  const getTimerElapsed = (task) => {
    if (task.timerRunning && task.startedAt) {
      const now = Date.now();
      const elapsed = Math.floor((now - task.startedAt) / 1000);
      return (task.spentSeconds || 0) + elapsed;
    }
    return task.spentSeconds || 0;
  };

  // Таймеры
  useEffect(() => {
    const cleanupTimers = () => {
      Object.values(timerRefs.current).forEach((interval) => {
        if (interval) {
          clearInterval(interval);
        }
      });
      timerRefs.current = {};
    };

    cleanupTimers();

    // Создаем новые таймеры для активных задач
    tasks.forEach((task) => {
      if (task.timerRunning && !timerRefs.current[task.id]) {
        timerRefs.current[task.id] = setInterval(() => {
          setTasks((prev) =>
            prev.map((t) => {
              if (t.id !== task.id) return t;
              if (t.status === 'done') return t;
              if (!t.timerRunning || !t.startedAt) return t;
              const now = Date.now();
              const elapsed = Math.floor((now - t.startedAt) / 1000);
              if (t.timerType === 'countdown') {
                const totalSpent = (t.spentSeconds || 0) + elapsed;
                const estimate = t.estimateMinutes * 60;
                if (totalSpent >= estimate) {
                  return { ...t, spentSeconds: estimate, timerRunning: false, startedAt: null };
                }
                // Не обновляем spentSeconds каждую секунду, только при остановке
                return t;
              } else {
                // timer: просто отображаем прошедшее время, не обновляем spentSeconds
                return t;
              }
            })
          );
        }, 1000);
      }
    });

    return cleanupTimers;
  }, [tasks]);

  // При монтировании компонента: если таймер был активен, корректно пересчитать spentSeconds
  useEffect(() => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.timerRunning && t.startedAt) {
          // Если задача была активна, ничего не делаем — расчет идёт по startedAt
          return t;
        }
        return t;
      })
    );
    // eslint-disable-next-line
  }, []);

  // Добавить задачу
  const handleAddTask = () => {
    if (!newTitle.trim() || !newEstimate) return;
    if (parseInt(newEstimate, 10) > 9999) {
      showNotification('Maximum of 9999 minutes per task', 'error', 3000);
      return;
    }
    const newTask = {
      id: Date.now(),
      title: newTitle,
      estimateMinutes: parseInt(newEstimate, 10),
      spentSeconds: 0,
      status: 'active',
      timerRunning: false,
      timerType: 'countdown',
      startedAt: null,
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTitle('');
    setNewEstimate('');
  };

  // Удалить задачу
  const handleDeleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Завершить задачу
  const handleCompleteTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'done', timerRunning: false } : t))
    );
  };

  // Запустить/остановить таймер
  const handleToggleTimer = (id) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          if (t.status === 'done') return t;
          if (!t.timerRunning) {
            // Запуск: сохраняем startedAt
            return { ...t, timerRunning: true, startedAt: Date.now() };
          } else {
            // Остановка: увеличиваем spentSeconds, сбрасываем startedAt
            let addSeconds = 0;
            if (t.startedAt) {
              addSeconds = Math.floor((Date.now() - t.startedAt) / 1000);
            }
            return {
              ...t,
              timerRunning: false,
              startedAt: null,
              spentSeconds: (t.spentSeconds || 0) + addSeconds,
            };
          }
        }
        return t;
      })
    );
  };

  // Сменить тип таймера
  const handleChangeTimerType = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              timerType: t.timerType === 'countdown' ? 'timer' : 'countdown',
              spentSeconds: 0,
              timerRunning: false,
            }
          : t
      )
    );
  };

  // Переместить задачу вверх/вниз
  const moveTask = (id, dir) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx < 0) return prev;
      const newArr = [...prev];
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
      return newArr;
    });
  };

  // Прогресс
  // Сумма оценок только для активных задач (не done)
  const totalEstimateSeconds = tasks.reduce(
    (sum, t) =>
      t.status !== 'done' && t.timerType === 'countdown' ? sum + t.estimateMinutes * 60 : sum,
    0
  );
  // totalSpent теперь учитывает реальное время для активных countdown задач
  const totalSpent = tasks.reduce((sum, t) => {
    if (t.status !== 'done' && t.timerType === 'countdown') {
      if (t.timerRunning && t.startedAt) {
        const now = Date.now();
        const elapsed = Math.floor((now - t.startedAt) / 1000);
        return sum + (t.spentSeconds || 0) + elapsed;
      }
      return sum + (t.spentSeconds || 0);
    }
    return sum;
  }, 0);
  // Сумма затраченного времени по выполненным задачам
  const totalDoneSpentSeconds = tasks.reduce(
    (sum, t) => (t.status === 'done' ? sum + (t.spentSeconds || 0) : sum),
    0
  );
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const activeCount = tasks.length - doneCount;

  // Проверяем, есть ли активные задачи с countdown таймером
  const hasActiveCountdownTasks = tasks.some(
    (t) => t.status !== 'done' && t.timerType === 'countdown'
  );

  // Форматирование времени: не выводить 0h или 0m, если они равны нулю
  const formatHHMMSS = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    let result = [];
    if (h > 0) result.push(`${h}h`);
    if (m > 0) result.push(`${m}m`);
    if (s > 0 || result.length === 0) result.push(`${s}s`);
    return result.join(' ');
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <div className="tasks-title">Tasks</div>
        <div className="tasks-settings"></div>
      </div>
      {hasActiveCountdownTasks && (
        <div className="tasks-progressbar">
          <div
            className="tasks-progress"
            style={{
              width: `${totalEstimateSeconds ? (totalSpent / totalEstimateSeconds) * 100 : 0}%`,
            }}
          />
        </div>
      )}
      <div className="tasks-summary">
        <span>Est {formatHHMMSS(totalEstimateSeconds)}</span>
        <span>
          {doneCount}/{tasks.length} done
        </span>
      </div>
      <div className="tasks-add">
        <input
          type="text"
          placeholder="Add task"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          type="number"
          min="1"
          max="9999"
          maxLength={4}
          placeholder="min"
          value={newEstimate}
          onChange={(e) => {
            let val = e.target.value;
            if (val.length > 4) val = val.slice(0, 4);
            setNewEstimate(val);
          }}
        />
        <button onClick={handleAddTask}>+</button>
      </div>
      <div className="tasks-list">
        {tasks
          .filter((t) => t.status !== 'done')
          .map((task, idx) => (
            <div
              className={`task-card${task.timerRunning ? ' active' : ''}${selectedTaskId === task.id ? ' cardFullScreen' : ''}`}
              key={task.id}
              onClick={(e) => {
                // Не делать fullscreen, если клик по .task-controls или её потомкам
                if (e.target.closest('.task-controls')) return;
                setSelectedTaskId(selectedTaskId === task.id ? null : task.id);
              }}
            >
              <div className="task-main">
                <div className="task-title">{task.title}</div>
                <div className="task-time">
                  {task.timerType === 'countdown'
                    ? formatHHMMSS(getCountdownLeft(task))
                    : formatHHMMSS(getTimerElapsed(task))}
                </div>
              </div>
              <div className="task-controls">
                <button onClick={() => handleToggleTimer(task.id)}>
                  {task.timerRunning ? <FaPause /> : <FaPlay />}
                </button>
                {!task.timerRunning && (
                  <button onClick={() => handleChangeTimerType(task.id)} title="Switch timer type">
                    {task.timerType === 'countdown' ? <FaRegClock /> : <FaStopwatch />}
                  </button>
                )}
                <button onClick={() => moveTask(task.id, 'up')} disabled={idx === 0}>
                  <FaArrowUp />
                </button>
                <button
                  onClick={() => moveTask(task.id, 'down')}
                  disabled={idx === tasks.filter((t) => t.status !== 'done').length - 1}
                >
                  <FaArrowDown />
                </button>
                {/* CompleteTask button только если таймер не активен */}
                {!task.timerRunning && (
                  <button onClick={() => handleCompleteTask(task.id)}>
                    <FaCheck />
                  </button>
                )}
                <button onClick={() => handleDeleteTask(task.id)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
      </div>
      <div className="tasks-done-header">
        {doneCount} Done{doneCount > 0 && ` — ${formatHHMMSS(totalDoneSpentSeconds)}`}
      </div>
      <div className="tasks-list done">
        {tasks
          .filter((t) => t.status === 'done')
          .map((task) => (
            <div className="task-card done" key={task.id}>
              <div className="task-main">
                <div className="task-title done">{task.title}</div>
                <div className="task-time done">{formatHHMMSS(task.spentSeconds)}</div>
              </div>
              <button
                className="task-delete-done"
                onClick={() => handleDeleteTask(task.id)}
                title="Delete task"
              >
                <FaTrash />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ContentTypeN;

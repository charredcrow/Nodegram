import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './TransactionGraph.css';
import { FaTimes } from 'react-icons/fa';

const TransactionGraph = ({ isOpen, onClose, transactions, currency }) => {
  const svgRef = useRef();
  const modalRef = useRef();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [graphData, setGraphData] = useState([]);
  const [viewMode, setViewMode] = useState('week');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Функция для получения начала недели (понедельник)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Функция для получения конца недели (воскресенье)
  const getEndOfWeek = (date) => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  // Функция для получения начала месяца
  const getStartOfMonth = (date) => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Функция для получения конца месяца
  const getEndOfMonth = (date) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const handleDatePickerClick = (e) => {
    e.stopPropagation();
    setShowDatePicker(!showDatePicker);
  };

  const handleDateChange = (date) => {
    if (date) {
      const startDate = new Date(date);
      setSelectedDate(startDate);
      setShowDatePicker(false);
    }
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    const newDate = new Date(selectedYear, month, 1);
    setSelectedDate(newDate);
    setShowDatePicker(false);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    const newDate = new Date(year, selectedMonth, 1);
    setSelectedDate(newDate);
    setShowDatePicker(false);
  };

  const handleResetDate = () => {
    setSelectedDate(null);
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
    setShowDatePicker(false);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSelectedDate(null);
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeek);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentWeek(newDate);
    setSelectedDate(null);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeek);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentWeek(newDate);
    setSelectedDate(null);
  };

  const handleCurrentWeek = () => {
    setCurrentWeek(new Date());
    setSelectedDate(null);
  };

  const prepareGraphData = () => {
    let startDate, endDate;

    if (viewMode === 'week') {
      startDate = selectedDate || getStartOfWeek(currentWeek);
      endDate = selectedDate ? getEndOfWeek(startDate) : getEndOfWeek(currentWeek);

      // Создаем массив из 7 дней для недели
      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        day.setHours(0, 0, 0, 0);

        const dayTransactions = transactions.filter((t) => {
          const transactionDate = new Date(t.transfer_time);
          transactionDate.setHours(0, 0, 0, 0);
          return transactionDate.getTime() === day.getTime();
        });

        const income = dayTransactions
          .filter((t) => t.transfer_type === 'income')
          .reduce((sum, t) => sum + Number(t.transfer_amount), 0);

        const outcome = dayTransactions
          .filter((t) => t.transfer_type === 'outcome')
          .reduce((sum, t) => sum + Number(t.transfer_amount), 0);

        days.push({
          date: day,
          dayName: DAYS_OF_WEEK[i],
          dayNumber: day.getDate(),
          income,
          outcome,
        });
      }
      setGraphData(days);
    } else {
      startDate = selectedDate || getStartOfMonth(currentWeek);
      endDate = selectedDate ? getEndOfMonth(startDate) : getEndOfMonth(currentWeek);

      const days = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayTransactions = transactions.filter((t) => {
          const transactionDate = new Date(t.transfer_time);
          transactionDate.setHours(0, 0, 0, 0);
          return transactionDate.getTime() === currentDate.getTime();
        });

        const income = dayTransactions
          .filter((t) => t.transfer_type === 'income')
          .reduce((sum, t) => sum + Number(t.transfer_amount), 0);

        const outcome = dayTransactions
          .filter((t) => t.transfer_type === 'outcome')
          .reduce((sum, t) => sum + Number(t.transfer_amount), 0);

        days.push({
          date: new Date(currentDate),
          dayName: currentDate.getDate().toString(),
          dayNumber: currentDate.getDate(),
          income,
          outcome,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
      setGraphData(days);
    }
  };

  // Функция для отрисовки графика
  const drawGraph = () => {
    if (!graphData.length) return;

    // Начальные отступы
    const initialMargin = { top: 10, right: 10, bottom: 30, left: 30 };
    const width = 830 - initialMargin.left - initialMargin.right;
    const height = 400 - initialMargin.top - initialMargin.bottom;

    // Очищаем предыдущий график
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width + initialMargin.left + initialMargin.right)
      .attr('height', height + initialMargin.top + initialMargin.bottom)
      .append('g')
      .attr('transform', `translate(${initialMargin.left},${initialMargin.top})`);

    // Создаем шкалы
    const x = d3
      .scalePoint()
      .domain(graphData.map((d) => d.dayName))
      .range([0, width])
      .padding(0.5);

    const maxValue = d3.max(graphData, (d) => Math.max(d.income, d.outcome)) || 0;
    const y = d3
      .scaleLinear()
      .domain([0, Math.max(maxValue * 1.3, 100)])
      .range([height, 0]);

    // Создаем временную группу для измерения ширины тиков
    const tempGroup = svg.append('g').attr('class', 'temp-axis').style('opacity', 0);

    const yAxis = d3.axisLeft(y);
    tempGroup.call(yAxis);

    // Измеряем максимальную ширину тиков
    const tickWidth = Math.max(
      ...tempGroup
        .selectAll('.tick text')
        .nodes()
        .map((node) => {
          const bbox = node.getBBox();
          return bbox.width;
        })
    );

    // Удаляем временную группу
    tempGroup.remove();

    // Вычисляем новые отступы
    const margin = {
      ...initialMargin,
      left: Math.max(initialMargin.left, tickWidth + 20), // 20px дополнительного пространства
    };

    // Обновляем размеры и позиции
    const newWidth = 830 - margin.left - margin.right;

    // Обновляем SVG размеры
    svg.attr('transform', `translate(${margin.left},${margin.top})`);

    // Обновляем x шкалу с новыми размерами
    x.range([0, newWidth]);

    // Добавляем оси
    svg
      .append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .each(function (d, i) {
        const day = graphData[i].date;
        const text = d3.select(this);
        if (selectedDate) {
          text.text(day.toLocaleDateString('ru-RU', { day: 'numeric' }));
        } else {
          text.text(viewMode === 'week' ? `${d}\n${day.getDate()}` : d);
        }
      })
      .style('text-anchor', 'middle')
      .attr('dy', selectedDate ? '1em' : '1em');

    svg.append('g').attr('class', 'axis').call(d3.axisLeft(y));

    // Создаем линии с обновленными размерами
    const incomeLine = d3
      .line()
      .x((d) => x(d.dayName))
      .y((d) => y(d.income))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const outcomeLine = d3
      .line()
      .x((d) => x(d.dayName))
      .y((d) => y(d.outcome))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Рисуем линии
    svg.append('path').datum(graphData).attr('class', 'line income-line').attr('d', incomeLine);

    svg.append('path').datum(graphData).attr('class', 'line outcome-line').attr('d', outcomeLine);

    // Добавляем точки для доходов
    svg
      .selectAll('.income-dot')
      .data(graphData)
      .enter()
      .append('circle')
      .attr('class', 'dot income-dot')
      .attr('cx', (d) => x(d.dayName))
      .attr('cy', (d) => y(d.income))
      .attr('r', 5)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('r', 8);

        if (d.income > 0) {
          const tooltipGroup = svg
            .append('g')
            .attr('class', 'tooltip-group')
            .attr('transform', `translate(${x(d.dayName)},${y(d.income)})`)
            .style('pointer-events', 'none');

          tooltipGroup
            .append('rect')
            .attr('class', 'tooltip-bg')
            .attr('x', -80)
            .attr('y', -48)
            .attr('width', 160)
            .attr('height', 40)
            .attr('rx', 4)
            .attr('ry', 4)
            .style('fill', 'var(--color-background-tertiary)')
            .style('stroke', 'var(--color-border-primary)')
            .style('stroke-width', '1px')
            .style('opacity', '0.95');

          const textGroup = tooltipGroup
            .append('g')
            .attr('class', 'tooltip-text')
            .style('pointer-events', 'none');

          textGroup
            .append('text')
            .attr('class', 'tooltip tooltip-date')
            .attr('x', 0)
            .attr('y', -30)
            .style('text-anchor', 'middle')
            .style('fill', 'var(--color-text-primary)')
            .style('font-size', '11px')
            .text(d.date.toLocaleDateString());

          textGroup
            .append('text')
            .attr('class', 'tooltip tooltip-amount')
            .attr('x', 0)
            .attr('y', -15)
            .style('text-anchor', 'middle')
            .style('fill', 'var(--color-success)')
            .style('font-weight', 'bold')
            .text(`+${d.income.toFixed(2)} ${currency}`);
        }
      })
      .on('mouseout', function () {
        d3.select(this).attr('r', 5);
        svg.selectAll('.tooltip-group').remove();
      });

    // Добавляем точки для расходов
    svg
      .selectAll('.outcome-dot')
      .data(graphData)
      .enter()
      .append('circle')
      .attr('class', 'dot outcome-dot')
      .attr('cx', (d) => x(d.dayName))
      .attr('cy', (d) => y(d.outcome))
      .attr('r', 5)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('r', 8);

        if (d.outcome > 0) {
          const tooltipGroup = svg
            .append('g')
            .attr('class', 'tooltip-group')
            .attr('transform', `translate(${x(d.dayName)},${y(d.outcome)})`)
            .style('pointer-events', 'none');

          tooltipGroup
            .append('rect')
            .attr('class', 'tooltip-bg')
            .attr('x', -80)
            .attr('y', -48)
            .attr('width', 160)
            .attr('height', 40)
            .attr('rx', 4)
            .attr('ry', 4)
            .style('fill', 'var(--color-background-tertiary)')
            .style('stroke', 'var(--color-border-primary)')
            .style('stroke-width', '1px')
            .style('opacity', '0.95');

          const textGroup = tooltipGroup
            .append('g')
            .attr('class', 'tooltip-text')
            .style('pointer-events', 'none');

          textGroup
            .append('text')
            .attr('class', 'tooltip tooltip-date')
            .attr('x', 0)
            .attr('y', -30)
            .style('text-anchor', 'middle')
            .style('fill', 'var(--color-text-primary)')
            .style('font-size', '11px')
            .text(d.date.toLocaleDateString());

          textGroup
            .append('text')
            .attr('class', 'tooltip tooltip-amount')
            .attr('x', 0)
            .attr('y', -15)
            .style('text-anchor', 'middle')
            .style('fill', 'var(--color-error)')
            .style('font-weight', 'bold')
            .text(`-${d.outcome.toFixed(2)} ${currency}`);
        }
      })
      .on('mouseout', function () {
        d3.select(this).attr('r', 5);
        svg.selectAll('.tooltip-group').remove();
      });

    // Добавляем сетку
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(7).tickSize(-height).tickFormat(''))
      .selectAll('.tick line')
      .attr('stroke', 'var(--color-border-primary)')
      .attr('stroke-opacity', 0.1);
  };

  // Обработчик клика по оверлею
  const handleOverlayClick = (event) => {
    if (event.target === modalRef.current) {
      onClose();
    }
    setShowDatePicker(false);
  };

  useEffect(() => {
    prepareGraphData();
  }, [currentWeek, selectedDate, transactions, viewMode]);

  useEffect(() => {
    if (graphData.length) {
      drawGraph();
    }
  }, [graphData]);

  if (!isOpen) return null;

  return (
    <div className="transaction-graph-modal" onClick={handleOverlayClick} ref={modalRef}>
      <div className="transaction-graph-content" onClick={(e) => e.stopPropagation()}>
        <div className="transaction-graph-header">
          <h2>Transactions graph</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="transaction-graph-controls">
          <div className="controls-row">
            {!(viewMode === 'month' && selectedDate) && (
              <div className="current-period">
                {viewMode === 'week'
                  ? `Week ${getStartOfWeek(currentWeek).getDate()}-${getEndOfWeek(currentWeek).getDate()} ${MONTHS[getStartOfWeek(currentWeek).getMonth()]} ${getStartOfWeek(currentWeek).getFullYear()}`
                  : `${MONTHS[currentWeek.getMonth()]} ${currentWeek.getFullYear()}`}
              </div>
            )}

            <div className="view-mode-toggle">
              <button
                className={viewMode === 'week' ? 'active' : ''}
                onClick={() => handleViewModeChange('week')}
              >
                Week
              </button>
              <button
                className={viewMode === 'month' ? 'active' : ''}
                onClick={() => handleViewModeChange('month')}
              >
                Month
              </button>
            </div>
          </div>

          <div className="controls-row">
            {!selectedDate && (
              <div className="period-navigation">
                <button onClick={handlePrevWeek}>← Previous</button>
                <button onClick={handleNextWeek}>Next →</button>
              </div>
            )}

            <button className="current-period-button" onClick={handleCurrentWeek}>
              Current {viewMode === 'week' ? 'Week' : 'Month'}
            </button>

            <div className="date-range-container">
              {viewMode === 'month' && (
                <>
                  <button className="date-picker-button" onClick={handleDatePickerClick}>
                    {selectedDate ? `${MONTHS[selectedMonth]} ${selectedYear}` : `Select Month`}
                  </button>
                  {showDatePicker && (
                    <>
                      <div
                        className="date-picker-overlay"
                        onClick={() => setShowDatePicker(false)}
                      />
                      <div className="date-picker" onClick={(e) => e.stopPropagation()}>
                        <div className="month-year-selector">
                          <div className="month-selector">
                            <label>Month:</label>
                            <select
                              value={selectedMonth}
                              onChange={(e) => handleMonthChange(Number(e.target.value))}
                            >
                              {MONTHS.map((month, index) => (
                                <option key={month} value={index}>
                                  {month}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="year-selector">
                            <label>Year:</label>
                            <select
                              value={selectedYear}
                              onChange={(e) => handleYearChange(Number(e.target.value))}
                            >
                              {Array.from(
                                { length: 10 },
                                (_, i) => new Date().getFullYear() - 5 + i
                              ).map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <button className="reset-date-range" onClick={handleResetDate}>
                          Reset to Current Month
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="transaction-graph-container">
          <svg ref={svgRef} width={800} height={400}></svg>
        </div>
      </div>
    </div>
  );
};

export default TransactionGraph;

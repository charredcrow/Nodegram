import React, { useState, useRef } from 'react';
import { CategorySelector, ConfirmationModal } from '../../../../shared/ui';
import { formatNumberWithSpaces } from '../../../../shared/api';
import { useNotification } from '../../../../app/providers/NotificationProvider';
import { TransactionGraph } from '../../../../shared/ui';
import { DateTimePicker } from '../../../../shared/ui';
import { CiSearch, CiPaperplane } from 'react-icons/ci';
import { MdOutlineUpcoming } from 'react-icons/md';
import { FiPlus } from 'react-icons/fi';
import { FaTimes, FaDice } from 'react-icons/fa';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import './ContentTypeG.css';

const ContentTypeG = ({ data, onUpdate, nodesData, links, currentWid, widModeShared }) => {
  const { showNotification } = useNotification();
  const [description, setDescription] = useState(data?.node?.description || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Добавляем состояния для управления видимостью блоков
  const [showFilter, setShowFilter] = useState(false);
  const [showBudgeting, setShowBudgeting] = useState(false);
  const [showUpcomingPayments, setShowUpcomingPayments] = useState(false);
  const [activeButton, setActiveButton] = useState(null);

  // Инициализация транзакций (из data.node.content)
  const initialTransactions = Array.isArray(data.node.content) ? data.node.content : [];
  const [transactions, setTransactions] = useState(initialTransactions);

  // Инициализация валюты: берем из data.node.currency, если отсутствует – по умолчанию "USD"
  const initialCurrency = data.node.currency ? data.node.currency : 'USD';
  const [currency, setCurrency] = useState(initialCurrency);

  // Добавляем состояние для пользовательской валюты
  const [customCurrency, setCustomCurrency] = useState('');
  const [isCustomCurrencyMode, setIsCustomCurrencyMode] = useState(false);

  // Состояния для новой транзакции (ручного ввода)
  const [newTransferName, setNewTransferName] = useState('');
  const [newTransferAmount, setNewTransferAmount] = useState('');
  const [newTransferType, setNewTransferType] = useState('income');
  const [newTransferTime, setNewTransferTime] = useState('');
  const [newTransferNote, setNewTransferNote] = useState('');

  // Add function to generate random transfer name
  const generateRandomTransferName = () => {
    const prefixes = ['Payment', 'Transfer', 'Transaction', 'Deposit', 'Withdrawal'];
    const types = ['Salary', 'Rent', 'Utilities', 'Shopping', 'Services', 'Investment', 'Refund'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    return `${randomPrefix} ${randomType} #${randomNumber}`;
  };

  // Add handler for random name generation
  const handleGenerateRandomName = () => {
    setNewTransferName(generateRandomTransferName());
  };

  // Фильтры: поиск по имени/заметке и диапазон дат
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo, setDateToOnChange] = useState('');

  // Состояние для бюджетирования (месячный бюджет)
  const [monthlyBudget, setMonthlyBudget] = useState('');

  // Добавляем состояния для модального окна подтверждения
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);

  // Добавляем состояния для категории
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories] = useState([
    'Salary', // Основной доход
    'Food', // Ежедневные расходы
    'Shopping', // Частые покупки
    'Groceries', // Ежедневные расходы
    'Transportation', // Регулярные расходы
    'Housing', // Основные расходы
    'Restaurants', // Частые расходы
    'Bar', // Частые расходы
    'Entertainment', // Регулярные расходы
    'Healthcare', // Важные расходы
    'Auto', // Крупные расходы
    'Communication', // Регулярные расходы
    'Education', // Периодические расходы
    'Investments', // Финансовые операции
    'Sales', // Дополнительный доход
    'Rent', // Периодические доходы
  ]);

  // Add state for transfer modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Add state for formatted amount display
  const [formattedAmount, setFormattedAmount] = useState('');

  // Обработчики для переключения видимости блоков
  const handleToggleAddRow = () => {
    setIsTransferModalOpen(true);
    setActiveButton('add');
  };

  const handleToggleFilter = () => {
    setShowFilter(!showFilter);
    setShowBudgeting(false);
    setShowUpcomingPayments(false);
    setActiveButton(showFilter ? null : 'filter');
    handleResetFilters();
  };

  const handleToggleBudgeting = () => {
    setShowBudgeting(!showBudgeting);
    setShowFilter(false);
    setShowUpcomingPayments(false);
    setActiveButton(showBudgeting ? null : 'budget');
    handleResetFilters();
  };

  const handleToggleUpcomingPayments = () => {
    setShowUpcomingPayments(!showUpcomingPayments);
    setShowFilter(false);
    setShowBudgeting(false);
    setActiveButton(showUpcomingPayments ? null : 'payments');
    handleResetFilters();
  };

  // Функция обновления транзакций (синхронизируется с onUpdate)
  const updateTransactions = (newTransactions) => {
    setTransactions(newTransactions);
    onUpdate({
      ...data,
      node: { ...data.node, content: newTransactions, currency },
    });
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    if (data && data.node) {
      onUpdate({
        ...data,
        node: { ...data.node, description: e.target.value },
      });
    }
  };

  // Helper: определяет, является ли переданная дата сегодняшней (без учета времени)
  const isToday = (someDate) => {
    const today = new Date();
    return (
      someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear()
    );
  };

  // Добавляем обработчик выбора категории
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  // Обновляем функцию добавления транзакции
  const handleAddTransaction = () => {
    if (newTransferName.trim() === '' || newTransferAmount === '') {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    const transferDate = newTransferTime ? new Date(newTransferTime) : new Date();
    const currentDate = new Date();
    const transfer_status = transferDate > currentDate ? 'pending' : 'paid';
    const newTransaction = {
      transfer_name: newTransferName,
      transfer_amount: Number(newTransferAmount.replace(/[^0-9.-]+/g, '')), // Remove formatting for calculation
      transfer_type: newTransferType,
      transfer_time: newTransferTime || new Date().toISOString(),
      transfer_note: newTransferNote,
      transfer_status: transfer_status,
      transfer_category: selectedCategory || '-',
    };
    const updatedTransactions = [...transactions, newTransaction];
    updateTransactions(updatedTransactions);
    showNotification('Transaction added successfully', 'success');
    // Очистка полей
    setNewTransferName('');
    setNewTransferAmount('');
    setFormattedAmount('');
    setNewTransferType('income');
    setNewTransferTime('');
    setNewTransferNote('');
    setSelectedCategory('');
  };

  // Add handler for amount input
  const handleAmountChange = (e) => {
    let value = e.target.value;

    // Allow only numbers and one decimal point
    value = value
      .replace(/[^\d.]/g, '') // Remove all non-numeric characters except .
      .replace(/(\..*)\./g, '$1'); // Allow only one decimal point

    // Limit decimal places to 2 digits
    const parts = value.split('.');
    if (parts.length > 1) {
      parts[1] = parts[1].slice(0, 2);
      value = parts.join('.');
    }

    // Update the input value directly
    e.target.value = value;

    // Update state with raw value
    setNewTransferAmount(value);

    // Format the display value with commas
    const wholePart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formattedValue = parts.length > 1 ? `${wholePart}.${parts[1]}` : wholePart;
    setFormattedAmount(formattedValue);
  };

  // Обновляем функцию удаления транзакции
  const handleDeleteTransaction = (index) => {
    setPendingDeleteIndex(index);
    setIsConfirmationOpen(true);
  };

  // Добавляем функции для обработки подтверждения/отмены удаления
  const handleConfirmDelete = () => {
    if (pendingDeleteIndex !== null) {
      const updatedTransactions = transactions.filter((_, i) => i !== pendingDeleteIndex);
      updateTransactions(updatedTransactions);
      setIsConfirmationOpen(false);
      setPendingDeleteIndex(null);
      showNotification('Transaction deleted successfully', 'success');
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmationOpen(false);
    setPendingDeleteIndex(null);
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
  };

  // Обновляем обработчики для DateTimePicker
  const handleDateFromChange = (value) => {
    setDateFrom(value || '');
  };

  const handleDateToChange = (value) => {
    setDateTo(value || '');
  };

  // --- Логика для получения транзакций из Orders ---
  // Находим все ссылки, где текущий Finance-блок (data.node.id) является source
  const connectedSource = (links || [])
    .filter((link) => link.source === data.node.id)
    .map((link) => link.target);

  // Из nodesData выбираем узлы с type === "typeF" (блоки Orders),
  // у которых id содержится в connectedSource.
  // Для каждого такого узла выбираем заказы с order_status === "Delivered"
  // и преобразуем их в объект транзакции.
  // const connectedOrdersTransactions = (nodesData || [])
  const connectedOrdersTransactions = []
    .filter((node) => connectedSource.includes(node.id) && node.type === 'typeF')
    .flatMap((node) => {
      if (Array.isArray(node.content)) {
        return node.content
          .filter((order) => order.order_status === 'Delivered')
          .map((order) => ({
            transfer_name: order.order_name, // Product Name
            transfer_amount: Number(order.order_total) * Number(order.order_amount),
            transfer_type: order.order_direction === 'incoming' ? 'outcome' : 'income', // Определяем тип транзакции на основе направления заказа
            transfer_time: order.order_date,
            transfer_note: order.order_note,
            transfer_status: 'paid',
            readOnly: true, // Только для отображения – не изменяется/удаляется
            orderId: order.order_id,
          }));
      }
      return [];
    });

  // --- Объединяем транзакции ---
  // Все транзакции = транзакции из state (ручные) + транзакции, полученные из Orders
  const allTransactions = [...transactions, ...connectedOrdersTransactions];

  // Фильтрация транзакций (по поиску и диапазону дат) на основе allTransactions
  const filteredTransactions = allTransactions.filter((tx) => {
    const searchMatch =
      tx.transfer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.transfer_note.toLowerCase().includes(searchTerm.toLowerCase());
    const txTime = new Date(tx.transfer_time);
    let dateMatch = true;
    if (dateFrom) {
      dateMatch = dateMatch && txTime >= new Date(dateFrom);
    }
    if (dateTo) {
      dateMatch = dateMatch && txTime <= new Date(dateTo);
    }
    return searchMatch && dateMatch;
  });

  // Сортировка транзакций от новых к старым (по времени)
  const sortedTransactions = filteredTransactions.sort(
    (a, b) => new Date(b.transfer_time) - new Date(a.transfer_time)
  );

  // Выбираем список транзакций для отображения (paid)
  const paidTransactions = sortedTransactions
    .filter((tx) => tx.transfer_status === 'paid')
    .sort((a, b) => new Date(b.transfer_time) - new Date(a.transfer_time)); // Сортировка от новых к старым

  // Блок предстоящих платежей – только pending (только ручные транзакции)
  const pendingTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.transfer_time);
    const currentDate = new Date();
    return tx.transfer_status === 'pending' && txDate > currentDate;
  });

  const pendingCount = pendingTransactions.length;

  // Обработка кнопки Complete для транзакции (ручной транзакции)
  const handleCompleteTransaction = (index) => {
    const updatedTransactions = [...transactions];
    updatedTransactions[index] = {
      ...updatedTransactions[index],
      transfer_status: 'paid',
    };
    updateTransactions(updatedTransactions);
    setShowUpcomingPayments(false);
    showNotification('Transaction completed successfully', 'success');
  };

  // --- Аналитика (на основе allTransactions) ---
  const balance = allTransactions.reduce((acc, tx) => {
    return tx.transfer_type === 'income'
      ? acc + Number(tx.transfer_amount)
      : acc - Number(tx.transfer_amount);
  }, 0);

  const totalTransactions = allTransactions.length;

  // Разделяем транзакции на доходы и расходы
  const incomeTransactions = allTransactions.filter((tx) => tx.transfer_type === 'income');
  const outcomeTransactions = allTransactions.filter((tx) => tx.transfer_type === 'outcome');

  // Рассчитываем средние значения отдельно для доходов и расходов
  const averageIncome =
    incomeTransactions.length > 0
      ? incomeTransactions.reduce((acc, tx) => acc + Number(tx.transfer_amount), 0) /
        incomeTransactions.length
      : 0;

  const averageOutcome =
    outcomeTransactions.length > 0
      ? outcomeTransactions.reduce((acc, tx) => acc + Number(tx.transfer_amount), 0) /
        outcomeTransactions.length
      : 0;

  const filteredSum = sortedTransactions.reduce((acc, tx) => {
    return tx.transfer_type === 'income'
      ? acc + Number(tx.transfer_amount)
      : acc - Number(tx.transfer_amount);
  }, 0);

  // Модуль бюджетирования: расходы за текущий месяц (только outcome)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthSpending = allTransactions.reduce((acc, tx) => {
    const txDate = new Date(tx.transfer_time);
    if (
      tx.transfer_type === 'outcome' &&
      txDate.getMonth() === currentMonth &&
      txDate.getFullYear() === currentYear
    ) {
      return acc + Number(tx.transfer_amount);
    }
    return acc;
  }, 0);
  const remainingBudget = monthlyBudget ? Number(monthlyBudget) - currentMonthSpending : null;

  // // Placeholder для Advanced Search
  // const handleAdvancedSearch = () => {
  //   alert("Advanced Search integration is coming soon.");
  // };

  // Placeholder для синхронизации с ERP/CRM и банковскими системами
  const handleSyncERP = () => {
    alert('Sync with Bank/ERP is coming soon.');
  };

  const [isGraphOpen, setIsGraphOpen] = useState(false);

  const formatAmount = (amount) => {
    const num = Number(amount);
    // Если число целое (т.е. после точки только нули)
    if (num % 1 === 0) {
      return num.toFixed(0);
    }
    // Иначе показываем 2 знака после точки
    return num.toFixed(2);
  };

  const [expandedTransaction, setExpandedTransaction] = useState(null);

  const handleViewTransaction = (index) => {
    setExpandedTransaction(expandedTransaction === index ? null : index);
  };

  // Add function to validate currency input
  const validateCurrencyInput = (value) => {
    // Check if input is a currency symbol
    const isSymbol = /^[$€£¥₽₴₸₩₫₱₲₳₴₵₶₷₸₹₺₻₼₽₾₿]$/.test(value);

    if (isSymbol) {
      return value; // Allow single symbol
    } else {
      // For non-symbols, allow only letters and numbers, max 3 characters
      return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3);
    }
  };

  // Add function to validate currency before update
  const validateCurrencyBeforeUpdate = (value) => {
    const isSymbol = /^[$€£¥₽₴₸₩₫₱₲₳₴₵₶₷₸₹₺₻₼₽₾₿]$/.test(value);
    const isCode = /^[a-zA-Z0-9]{1,3}$/.test(value);

    return isSymbol || isCode;
  };

  if (!data || !data.node) {
    return <div>Error: Invalid data</div>;
  }

  return (
    <div className="сontentType_container">
      <div className="сontentType_inputContainer">
        {/* (При необходимости можно отобразить описание узла) */}

        <div className="сontentTypeG_financeContainer">
          <div className="сontentTypeG_financeCnt">
            <div className="сontentTypeG_financeTotalBalance">
              <span className="сontentTypeG_financeTotalBalanceTitle">Total balance</span>
              <span className="сontentTypeG_financeBalance">
                <strong>{formatNumberWithSpaces(balance.toFixed(2))}</strong> {currency}
              </span>
              {(() => {
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

                // Calculate current month's balance
                const currentMonthBalance = allTransactions.reduce((acc, tx) => {
                  const txDate = new Date(tx.transfer_time);
                  if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                    return tx.transfer_type === 'income'
                      ? acc + Number(tx.transfer_amount)
                      : acc - Number(tx.transfer_amount);
                  }
                  return acc;
                }, 0);

                // Calculate previous month's balance
                const prevMonthBalance = allTransactions.reduce((acc, tx) => {
                  const txDate = new Date(tx.transfer_time);
                  if (txDate.getMonth() === prevMonth && txDate.getFullYear() === prevYear) {
                    return tx.transfer_type === 'income'
                      ? acc + Number(tx.transfer_amount)
                      : acc - Number(tx.transfer_amount);
                  }
                  return acc;
                }, 0);

                // Calculate percentage change
                const percentChange =
                  prevMonthBalance === 0
                    ? 0
                    : ((currentMonthBalance - prevMonthBalance) / Math.abs(prevMonthBalance)) * 100;

                return (
                  <>
                    <div
                      className={`finance-metric-change ${percentChange >= 0 ? 'positive' : 'negative'}`}
                    >
                      {percentChange >= 0 ? '+' : ''}
                      {percentChange.toFixed(1)}%
                    </div>
                    <span className="сontentTypeG_lastMonth">from last month</span>
                  </>
                );
              })()}
            </div>
            <div className="сontentTypeG_Anlcs">
              <span className="сontentTypeG_financeAnalyticsTitle">Filtered balance</span>
              <span className="сontentTypeG_financeAnalyticsInfo">
                {formatNumberWithSpaces(filteredSum.toFixed(2))} {currency}
              </span>
            </div>
            <div className="сontentTypeG_Anlcs">
              <span className="сontentTypeG_financeAnalyticsTitle">Total transactions</span>
              <span className="сontentTypeG_financeAnalyticsInfo">{totalTransactions}</span>
            </div>
            <div className="сontentTypeG_Anlcs">
              <span className="сontentTypeG_financeAnalyticsTitle">Average transactions</span>
              <span className="сontentTypeG_financeAnalyticsInfo typeG_action">
                <span style={{ color: '#8aca46' }}>
                  +{formatNumberWithSpaces(averageIncome.toFixed(2))}
                </span>{' '}
                <span style={{ color: '#ca4646' }}>
                  -{formatNumberWithSpaces(averageOutcome.toFixed(2))}
                </span>
              </span>
            </div>
          </div>

          <div className="сontentTypeG_financeAnalyticsButtons">
            <span
              className={`сontentTypeG_financeAnalyticsButton ${activeButton === 'filter' ? 'btnActive' : ''}`}
              onClick={handleToggleFilter}
            >
              <CiSearch /> Search
            </span>
            <span
              className={`сontentTypeG_financeAnalyticsButton ${activeButton === 'budget' ? 'btnActive' : ''}`}
              onClick={handleToggleBudgeting}
            >
              <CiPaperplane /> Budgeting
            </span>
            <span
              className={`сontentTypeG_financeAnalyticsButton `}
              onClick={handleToggleUpcomingPayments}
            >
              {pendingCount > 0 ? (
                <strong>
                  <span style={{ color: 'var(--main-color-primary)', fontSize: '16px' }}>
                    {pendingCount}
                  </span>
                </strong>
              ) : (
                <MdOutlineUpcoming />
              )}{' '}
              Upcoming
            </span>
            <span className={`сontentTypeG_financeAnalyticsButton `} onClick={handleToggleAddRow}>
              <FiPlus /> Transfer
            </span>
          </div>

          {/* Remove the old transfer add row and add the new modal */}
          {isTransferModalOpen && (
            <div
              className="сontentTypeG_modalOverlayTransfer"
              onClick={() => setIsTransferModalOpen(false)}
            >
              <div
                className="сontentTypeG_modalContentTransfer"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="сontentTypeG_modalHeaderTransfer">
                  <h3>Add New Transaction</h3>
                  <button
                    className="сontentTypeG_modalCloseTransfer"
                    onClick={() => setIsTransferModalOpen(false)}
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="сontentTypeG_transferAddRowTransfer">
                  <div className="сontentTypeG_transferInputGroup">
                    <div className="сontentTypeG_transferNameContainer">
                      <input
                        id="newTransferName"
                        type="text"
                        value={newTransferName}
                        onChange={(e) => setNewTransferName(e.target.value)}
                        placeholder="Transfer Name *"
                        className="сontentTypeG_transferInput"
                      />
                      <button
                        className="сontentTypeG_generateNameButton"
                        onClick={handleGenerateRandomName}
                        type="button"
                        title="Generate random name"
                      >
                        <FaDice />
                      </button>
                    </div>
                  </div>
                  <div className="сontentTypeG_transferInputGroup">
                    <input
                      id="newTransferAmount"
                      type="text"
                      value={formattedAmount}
                      onChange={handleAmountChange}
                      placeholder="100.00"
                      className="сontentTypeG_transferInput"
                    />
                  </div>
                  <div className="сontentTypeG_transferInputGroup">
                    <select
                      id="newTransferType"
                      value={newTransferType}
                      onChange={(e) => setNewTransferType(e.target.value)}
                      className="сontentTypeG_transferInput"
                    >
                      <option value="income">Incoming</option>
                      <option value="outcome">Outgoing</option>
                    </select>
                  </div>
                  <div className="сontentTypeG_transferInputGroup ">
                    <DateTimePicker
                      value={newTransferTime}
                      onChange={(value) => setNewTransferTime(value)}
                      className="сontentTypeG_transferInput bg_none p0 brbt0"
                    />
                  </div>
                  <div className="сontentTypeG_transferInputGroup">
                    <textarea
                      id="newTransferNote"
                      value={newTransferNote}
                      onChange={(e) => setNewTransferNote(e.target.value)}
                      placeholder="Note"
                      className="сontentTypeG_transferInput b1p"
                    />
                  </div>
                  <div className="сontentTypeG_SelectContainer">
                    <div className="сontentTypeG_transferInputGroup brbt0">
                      <label htmlFor="transferCategory">Category</label>
                      {selectedCategory ? (
                        <div className="сontentTypeG_selectedCategory">
                          <span>{selectedCategory}</span>
                          <button
                            className="сontentTypeG_deleteCategoryButton"
                            onClick={() => setSelectedCategory('')}
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <button
                          className="сontentTypeG_selectCategoryButton"
                          onClick={() => setIsCategorySelectorOpen(true)}
                        >
                          Select category
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    className="сontentTypeG_transferAdd tpyG_addTransaction"
                    onClick={() => {
                      handleAddTransaction();
                      setIsTransferModalOpen(false);
                    }}
                  >
                    <strong>Make transfer</strong>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            className={`сontentTypeG_transferFilter ${showFilter ? 'show' : ''}`}
            style={{
              display: showFilter ? 'flex' : 'none',
              opacity: showFilter ? 1 : 0,
              transform: showFilter ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'all 0.3s ease',
            }}
          >
            <div className="сontentTypeG_transferFilterGroup">
              <label htmlFor="transferSearch">Search</label>
              <input
                id="transferSearch"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or note"
                className="сontentTypeG_transferFilterInput"
              />
            </div>
            <div className="сontentTypeG_transferFilterGroup">
              <label htmlFor="dateFrom">From</label>
              <input
                type="date"
                id="dateFrom"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="сontentTypeG_dateInput"
              />
            </div>
            <div className="сontentTypeG_transferFilterGroup">
              <label htmlFor="dateTo">To</label>
              <input
                type="date"
                id="dateTo"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="сontentTypeG_dateInput"
              />
            </div>
            <button className="сontentTypeG_resetButton" onClick={handleResetFilters}>
              <strong>Reset</strong>
            </button>
          </div>

          <div
            className={`сontentTypeG_budgeting ${showBudgeting ? 'show' : ''}`}
            style={{
              display: showBudgeting ? 'block' : 'none',
              opacity: showBudgeting ? 1 : 0,
              transform: showBudgeting ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'all 0.3s ease',
            }}
          >
            <div className="сontentTypeG_budgetInputGroup">
              <input
                id="monthlyBudget"
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="Enter monthly budget"
                className="сontentTypeG_budgetInput"
              />
            </div>
            <div className="сontentTypeG_budgetAnalytics">
              <span>
                Current Month Spending: {currentMonthSpending.toFixed(2)} {currency}
              </span>
              {monthlyBudget && (
                <span>
                  Remaining Budget: {(Number(monthlyBudget) - currentMonthSpending).toFixed(2)}{' '}
                  {currency}
                </span>
              )}
            </div>
          </div>

          {/* Модальное окно предстоящих платежей */}
          {showUpcomingPayments && (
            <div
              className="сontentTypeG_modalOverlayUpcoming"
              onClick={() => setShowUpcomingPayments(false)}
            >
              <div
                className="сontentTypeG_modalContentUpcoming"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="сontentTypeG_modalHeaderUpcoming">
                  <h3>Upcoming Payments</h3>
                  <button
                    className="сontentTypeG_modalCloseUpcoming"
                    onClick={() => setShowUpcomingPayments(false)}
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="сontentTypeG_upcomingPaymentsUpcoming">
                  {pendingTransactions && pendingTransactions.length > 0 ? (
                    pendingTransactions.map((tx, index) => (
                      <div key={index} className="сontentTypeG_upcomingPaymentItemUpcoming">
                        <span>{new Date(tx.transfer_time).toLocaleString().split(',')[0]}</span>
                        <span>{tx.transfer_name}</span>
                        <span>
                          {tx.transfer_type === 'outcome' ? '-' : ''}
                          {Number(tx.transfer_amount).toFixed(2)} {currency}
                        </span>
                        <span>{tx.transfer_note}</span>
                        <button
                          className="сontentTypeG_completeButtonUpcoming"
                          onClick={() => handleCompleteTransaction(transactions.indexOf(tx))}
                        >
                          <strong>Complete</strong>
                        </button>
                        <button
                          className="сontentTypeG_declineButtonUpcoming"
                          onClick={() => handleDeleteTransaction(transactions.indexOf(tx))}
                        >
                          Decline
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="сontentTypeG_noUpcomingPaymentsUpcoming">
                      No upcoming payments.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Выбор валюты */}
          <div className="сontentTypeG_currencySelector">
            <div
              className="сontentTypeG_currencySelector_graph"
              onClick={() => setIsGraphOpen(true)}
              style={{ cursor: 'pointer' }}
            >
              View graphics
            </div>
            <select
              id="currencySelect"
              value={currency}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomCurrencyMode(true);
                } else {
                  setIsCustomCurrencyMode(false);
                  setCurrency(e.target.value);
                  onUpdate({
                    ...data,
                    node: { ...data.node, currency: e.target.value },
                  });
                }
              }}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="$">$</option>
              <option value="€">€</option>
              <option value="£">£</option>

              {currency && !['USD', 'EUR', 'GBP', '$', '€', '£'].includes(currency) && (
                <option value={currency}>{currency}</option>
              )}
              <option value="custom">+ New currency</option>
            </select>
            {isCustomCurrencyMode && (
              <div className="сontentTypeG_customCurrencyInput">
                <input
                  type="text"
                  value={customCurrency}
                  onChange={(e) => {
                    const validatedValue = validateCurrencyInput(e.target.value);
                    setCustomCurrency(validatedValue);
                  }}
                  placeholder="Enter currency code (e.g., USD) or symbol (e.g., $)"
                  maxLength={3}
                />
                <button
                  className="сontentTypeG_transferAddButton"
                  onClick={() => {
                    if (validateCurrencyBeforeUpdate(customCurrency)) {
                      setCurrency(customCurrency);
                      setIsCustomCurrencyMode(false);
                      onUpdate({
                        ...data,
                        node: { ...data.node, currency: customCurrency },
                      });
                      setCustomCurrency('');
                    } else {
                      showNotification('Please enter a valid currency code or symbol', 'error');
                    }
                  }}
                >
                  Add
                </button>
                <button
                  className="сontentTypeG_resetButton"
                  onClick={() => {
                    setIsCustomCurrencyMode(false);
                    setCustomCurrency('');
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Основной список транзакций (paid) */}
          <div className="сontentTypeG_transferList">
            {paidTransactions && paidTransactions.length > 0 ? (
              paidTransactions.map((tx, index) => (
                <div
                  key={`${tx.readOnly ? 'orders' : 'manual'}-${index}`}
                  className={`сontentTypeG_transferItem ${expandedTransaction === index ? 'expanded' : ''}`}
                >
                  <div className="transferCompact">
                    <div className="transferName">
                      {tx.transfer_name}
                      {tx.transfer_category && tx.transfer_category !== '-' ? (
                        <>
                          <br />
                          <span className="transferCtgr">{tx.transfer_category}</span>
                        </>
                      ) : null}
                    </div>
                    <div className="transferTime">
                      {new Date(tx.transfer_time).toLocaleString(undefined, {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="transferType">
                      <span
                        style={{ color: tx.transfer_type === 'outcome' ? '#ca4646' : '#8aca46' }}
                      >
                        {tx.transfer_type === 'outcome' ? '-' : '+'}
                      </span>
                      <span
                        style={{ color: tx.transfer_type === 'outcome' ? '#ca4646' : '#8aca46' }}
                      >
                        {formatNumberWithSpaces(tx.transfer_amount)} {currency}
                      </span>
                    </div>
                    <div className="transferActions">
                      {tx.readOnly ? (
                        <button
                          className="сontentTypeG_deleteTransactionButton сontentTypeG_deleteDisabled"
                          disabled
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          className="сontentTypeG_deleteTransactionButton"
                          onClick={() => handleDeleteTransaction(transactions.indexOf(tx))}
                        >
                          Delete
                        </button>
                      )}
                      <button
                        className="сontentTypeG_viewButton"
                        onClick={() => handleViewTransaction(index)}
                      >
                        {expandedTransaction === index ? <IoIosArrowUp /> : <IoIosArrowDown />}
                      </button>
                    </div>
                  </div>

                  <div className="transferDetails">
                    <div className="transferName">{tx.transfer_name}</div>
                    <div className="transferTime">
                      {new Date(tx.transfer_time).toLocaleString(undefined, {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="transferType">
                      {tx.transfer_type === 'outcome' ? '-' : ''}
                      {formatNumberWithSpaces(tx.transfer_amount)} {currency}
                    </div>
                    <div className="transferCategory">{tx.transfer_category || 'No category'}</div>
                    <div className="transferNote">{tx.transfer_note || '-'}</div>
                    <span className="сontentTypeG_copyButtonContainer">
                      <button
                        className="сontentTypeG_copyButton"
                        onClick={() => {
                          const transactionData = {
                            Name: tx.transfer_name,
                            Date: new Date(tx.transfer_time).toLocaleString(),
                            Amount: `${tx.transfer_type === 'outcome' ? '-' : ''}${formatAmount(tx.transfer_amount)} ${currency}`,
                            Category: tx.transfer_category || '-',
                            Note: tx.transfer_note || '-',
                          };
                          const textToCopy = Object.entries(transactionData)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join('\n');
                          navigator.clipboard.writeText(textToCopy);
                          showNotification('Transaction data copied to clipboard', 'success');
                        }}
                      >
                        <strong>Copy details</strong>
                      </button>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="сontentTypeG_transferItem">
                <div className="transferCompact">
                  <div className="transferName">-</div>
                  <div className="transferTime">-</div>
                  <div className="transferType">-</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Добавляем компонент ConfirmationModal */}
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        message="Are you sure you want to delete this transaction?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Добавляем компонент CategorySelector */}
      <CategorySelector
        isOpen={isCategorySelectorOpen}
        onClose={() => setIsCategorySelectorOpen(false)}
        onSelect={handleCategorySelect}
        categories={categories}
      />

      <TransactionGraph
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        transactions={allTransactions}
        currency={currency}
      />
    </div>
  );
};

export default ContentTypeG;

import React, { useState, useRef } from 'react';
import { ConfirmationModal } from '../../../../shared/ui';
import { useNotification } from '../../../../app/providers/NotificationProvider';
import { VscNewFile } from 'react-icons/vsc';
import { CiSearch } from 'react-icons/ci';
import { FaTimes, FaDice } from 'react-icons/fa';
import { MdRefresh } from 'react-icons/md';
import './ContentTypeF.css';

const ContentTypeF = ({ data, onUpdate, nodesData, links }) => {
  const { showNotification } = useNotification();
  const [description, setDescription] = useState(data?.node?.description || '');
  const [isFocused, setIsFocused] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editOrderUid, setEditOrderUid] = useState(null);
  const [orderForm, setOrderForm] = useState({
    order_id: '',
    order_name: '',
    customer_name: '',
    order_date: '',
    order_total: '',
    order_amount: '',
    order_status: 'Pending',
    order_note: '',
    order_direction: 'outgoing',
  });
  const [orders, setOrders] = useState(Array.isArray(data.node.content) ? data.node.content : []);
  const [errors, setErrors] = useState({});
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const inputRef = useRef(null);

  // Валюта
  const connectedTargets = links
    .filter((link) => link.target === data.node.id)
    .map((link) => link.source);
  const connectedNodes = nodesData.filter(
    (node) => connectedTargets.includes(node.id) && node.type === 'typeG'
  );
  const ordersCurrency =
    connectedNodes.length > 0 &&
    connectedNodes[0].currency &&
    connectedNodes[0].currency.trim() !== ''
      ? connectedNodes[0].currency
      : 'USD';

  // Расчет общей суммы доставленных товаров
  const calculateDeliveredTotal = (direction) => {
    return orders
      .filter((order) => order.order_status === 'Delivered' && order.order_direction === direction)
      .reduce((total, order) => total + Number(order.order_total) * Number(order.order_amount), 0);
  };

  const deliveredSendTotal = calculateDeliveredTotal('outgoing');
  const deliveredReceiveTotal = calculateDeliveredTotal('incoming');

  // Utility to generate unique id
  const generateUid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  // Модалка: открыть для добавления или редактирования
  const openOrderModal = (order, idx = null) => {
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setOrderForm(
      order
        ? { ...order }
        : {
            uid: generateUid(),
            order_id: '',
            order_name: '',
            customer_name: '',
            order_date: localDateTime,
            order_total: '0.00',
            order_amount: '1',
            order_status: 'Pending',
            order_note: '',
            order_direction: 'outgoing',
          }
    );
    setEditOrderUid(order ? order.uid : null);
    setIsOrderModalOpen(true);
  };

  // Сохранить заказ (добавить или обновить)
  const handleSaveOrder = () => {
    // Валидация
    const errs = {};
    if (!orderForm.order_id.trim()) errs.order_id = 'Order ID required';
    if (!orderForm.order_name.trim()) errs.order_name = 'Product Name required';
    if (!orderForm.customer_name.trim()) errs.customer_name = 'Customer Name required';
    if (!orderForm.order_total || Number(orderForm.order_total) < 0)
      errs.order_total = 'Price required';
    if (!orderForm.order_amount || Number(orderForm.order_amount) < 1)
      errs.order_amount = 'Quantity required';

    // Проверка уникальности ID только для новых заказов или при изменении ID
    if (
      editOrderUid === null ||
      orderForm.order_id !== orders.find((o) => o.uid === editOrderUid)?.order_id
    ) {
      if (orders.some((o) => o.order_id === orderForm.order_id && o.uid !== editOrderUid)) {
        errs.order_id = 'Order ID must be unique';
      }
    }

    if (Object.keys(errs).length > 0) {
      // Show first error using notification
      const firstError = Object.values(errs)[0];
      showNotification(firstError, 'error', 3000);
      return;
    }

    let updatedOrders;
    if (editOrderUid !== null) {
      // Сохраняем uid при редактировании
      updatedOrders = orders.map((order) =>
        order.uid === editOrderUid ? { ...orderForm, uid: order.uid } : { ...order }
      );
    } else {
      updatedOrders = [...orders, { ...orderForm, uid: orderForm.uid || generateUid() }];
    }

    setOrders(updatedOrders);
    onUpdate({ ...data, node: { ...data.node, content: updatedOrders } });
    setIsOrderModalOpen(false);
    setEditOrderUid(null);
    showNotification(editOrderUid !== null ? 'Order updated' : 'Order added', 'success', 2000);
  };

  // Удаление заказа
  const handleDeleteOrder = (idx) => {
    setOrderToDelete(idx);
    setIsConfirmationModalOpen(true);
  };
  const handleConfirmDelete = () => {
    const updatedOrders = orders.filter((_, i) => i !== orderToDelete);
    setOrders(updatedOrders);
    onUpdate({ ...data, node: { ...data.node, content: updatedOrders } });
    setOrderToDelete(null);
    setIsConfirmationModalOpen(false);
    showNotification('Order deleted', 'success', 2000);
  };
  const handleCancelDelete = () => {
    setOrderToDelete(null);
    setIsConfirmationModalOpen(false);
  };

  // Bulk edit status
  const handleBulkEdit = () => {
    if (!bulkStatus) return;
    const updatedOrders = orders.map((order, idx) =>
      selectedOrders.includes(idx) ? { ...order, order_status: bulkStatus } : order
    );
    setOrders(updatedOrders);
    onUpdate({ ...data, node: { ...data.node, content: updatedOrders } });
    setSelectedOrders([]);
    setBulkStatus('');
    showNotification('Bulk status updated', 'success', 2000);
  };

  // Обработчик сортировки
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Фильтрация и сортировка
  const filteredOrders = orders.filter(
    (order) =>
      (order.order_id.toLowerCase().includes(filterText.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(filterText.toLowerCase()) ||
        order.order_name.toLowerCase().includes(filterText.toLowerCase())) &&
      (filterStatus === '' || order.order_status === filterStatus)
  );
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortField === 'order_date') {
      return sortOrder === 'asc'
        ? new Date(a.order_date) - new Date(b.order_date)
        : new Date(b.order_date) - new Date(a.order_date);
    }
    if (sortField === 'order_total') {
      return sortOrder === 'asc' ? a.order_total - b.order_total : b.order_total - a.order_total;
    }
    if (sortField === 'order_amount') {
      return sortOrder === 'asc'
        ? Number(a.order_amount) - Number(b.order_amount)
        : Number(b.order_amount) - Number(a.order_amount);
    }
    if (sortField === 'order_status') {
      return sortOrder === 'asc'
        ? a.order_status.localeCompare(b.order_status)
        : b.order_status.localeCompare(a.order_status);
    }
    return 0;
  });

  // Generate random order ID
  const generateRandomOrderId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 5);
    const newOrderId = `N-${timestamp}-${randomStr}`.toUpperCase();
    setOrderForm({ ...orderForm, order_id: newOrderId });
  };

  // --- Логика для стрелок и валидации (как в ContentTypeE) ---
  const validateNumberInput = (value) => {
    const numbersOnly = value.replace(/[^\d]/g, '');
    return numbersOnly === '' ? '1' : numbersOnly;
  };
  const validatePriceInput = (value) => {
    let val = value.replace(/[^\d.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    if (parts[1]) val = parts[0] + '.' + parts[1].slice(0, 2);
    return val;
  };
  const handleQuantityChange = (currentValue, change) => {
    const newValue = Math.max(1, parseInt(currentValue) + change);
    return newValue.toString();
  };
  const handlePriceChange = (currentValue, change) => {
    let val = parseFloat(currentValue);
    if (isNaN(val)) val = 0;
    let newValue = Math.max(0, val + change);
    return newValue.toFixed(2);
  };

  // UI
  return (
    <div className="сontentType_container">
      <div className="сontentType_inputContainer">
        {/* Header */}
        <div className="сontentTypeF_header">
          <div className="сontentTypeF_headerLeft">
            <h2 className="сontentTypeF_title">Orders</h2>
            <div className="сontentTypeF_headerInfo">
              <span className="сontentTypeF_subtitle">{orders.length} orders</span>
              <div className="сontentTypeF_deliveredInfo">
                <span className="сontentTypeF_deliveredLabel">Delivered:</span>
                <span className="сontentTypeF_deliveredValue">
                  Received: {deliveredSendTotal.toFixed(2)} {ordersCurrency}
                </span>
                <span className="сontentTypeF_deliveredValue">
                  Paid: {deliveredReceiveTotal.toFixed(2)} {ordersCurrency}
                </span>
              </div>
            </div>
          </div>
          <div className="сontentTypeF_headerRight">
            <button className="сontentTypeF_addButton" onClick={() => openOrderModal(null)}>
              <VscNewFile /> Add order
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="сontentTypeF_filterPanel">
          <div className="сontentTypeF_filterGrid">
            <div className="сontentTypeF_filterGroup">
              <div className="сontentTypeF_filterInputs">
                <input
                  type="text"
                  placeholder="Search"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
            </div>
            <div className="сontentTypeF_filterGroup">
              <div className="сontentTypeF_filterInputs">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Edit */}
        {/* {selectedOrders.length > 0 && (
          <div className="сontentTypeF_bulkEditPanel">
            <div className="сontentTypeF_itemModalHeader">
              <h3>Bulk Edit Status</h3>
            </div>
            <div className="сontentTypeF_itemModalBody">
              <div className="itemModalFieldContainer">
                <div className="сontentTypeF_itemModalField">
                  <label>Status</label>
                  <select
                    value={bulkStatus}
                    onChange={e => setBulkStatus(e.target.value)}
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="сontentTypeF_itemModalFooter">
              <button className="сontentTypeF_itemModalSave" onClick={handleBulkEdit}>Apply</button>
            </div>
          </div>
        )} */}

        {/* Orders List */}
        <div className="сontentTypeF_inventoryGrid">
          <div className="сontentTypeF_gridHeaderContent">
            <div className="сontentTypeF_gridHeaderCell" onClick={() => handleSort('order_date')}>
              <span>Date</span> {sortField === 'order_date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </div>
            <div className="сontentTypeF_gridHeaderCell" onClick={() => handleSort('order_total')}>
              <span>Price</span> {sortField === 'order_total' && (sortOrder === 'asc' ? '↑' : '↓')}
            </div>
          </div>
          {sortedOrders.map((order, idx) => (
            <div key={order.uid || idx} className="сontentTypeF_inventoryItem">
              {/* <input
                type="checkbox"
                checked={selectedOrders.includes(idx)}
                onChange={e => {
                  if (e.target.checked) setSelectedOrders([...selectedOrders, idx]);
                  else setSelectedOrders(selectedOrders.filter(i => i !== idx));
                }}
              /> */}
              <div className="сontentTypeF_inventoryItemContent">
                <span className="сontentTypeF_inventoryItemName">
                  <span>
                    <span
                      className={`order-status-dot ${
                        order.order_status === 'Delivered'
                          ? 'order-status-dot--green'
                          : order.order_status === 'Cancelled'
                            ? 'order-status-dot--red'
                            : 'order-status-dot--yellow'
                      }`}
                    />
                    {order.order_name}
                  </span>{' '}
                  <span className="сontentTypeF_inventoryItemId">ID: {order.order_id}</span>
                </span>
              </div>
              <div className="сontentTypeF_inventoryItemContent сontentTypeF_inventoryItemCustomer">
                <span className="сontentTypeF_inventoryItemName">{order.customer_name}</span>
              </div>
              <div className="сontentTypeF_inventoryItemContent сontentTypeF_inventoryItemDate">
                <span className="сontentTypeF_inventoryItemName сontentTypeF_inventoryItemId">
                  {order.order_date
                    ? new Date(order.order_date).toLocaleString(undefined, {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </div>
              <div className="сontentTypeF_inventoryItemPrice">
                {Number(order.order_total).toFixed(2)} {ordersCurrency}
              </div>
              <div className="сontentTypeF_inventoryItemActions">
                <button
                  className="сontentTypeF_viewButton"
                  onClick={() => openOrderModal(order, idx)}
                >
                  Edit
                </button>
                <button
                  className="сontentTypeF_deleteButton"
                  onClick={() => handleDeleteOrder(idx)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Модальное окно заказа */}
        {isOrderModalOpen && (
          <div className="сontentTypeF_itemModalOverlay" onClick={() => setIsOrderModalOpen(false)}>
            <div className="сontentTypeF_itemModalContent" onClick={(e) => e.stopPropagation()}>
              <div className="сontentTypeF_itemModalHeader">
                <h3>{editOrderUid !== null ? 'Edit Order' : 'Add New Order'}</h3>
                <button
                  className="сontentTypeF_itemModalClose"
                  onClick={() => setIsOrderModalOpen(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="сontentTypeF_itemModalBody">
                <div className="сontentTypeF_itemModalField">
                  <div className="сontentTypeF_orderIdContainer">
                    <input
                      type="text"
                      className="сontentTypeF_itemModalFieldInputOrderId"
                      value={orderForm.order_id}
                      onChange={(e) => setOrderForm({ ...orderForm, order_id: e.target.value })}
                      maxLength={20}
                      placeholder="Order ID"
                    />
                    <button
                      className="сontentTypeF_generateIdButton"
                      onClick={generateRandomOrderId}
                      type="button"
                    >
                      <FaDice />
                    </button>
                  </div>
                  {errors.order_id && <span className="error-message">{errors.order_id}</span>}
                </div>
                <div className="itemModalFieldContainer">
                  <div className="сontentTypeF_itemModalField">
                    <input
                      type="text"
                      value={orderForm.order_name}
                      onChange={(e) => setOrderForm({ ...orderForm, order_name: e.target.value })}
                      maxLength={30}
                      placeholder="Product Name"
                    />
                    {errors.order_name && (
                      <span className="error-message">{errors.order_name}</span>
                    )}
                  </div>
                  <div className="сontentTypeF_itemModalField">
                    <input
                      type="text"
                      value={orderForm.customer_name}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, customer_name: e.target.value })
                      }
                      maxLength={30}
                      placeholder="Customer Name"
                    />
                    {errors.customer_name && (
                      <span className="error-message">{errors.customer_name}</span>
                    )}
                  </div>
                </div>
                <div className="itemModalFieldContainer">
                  <div className="сontentTypeF_itemModalField">
                    <label htmlFor="order_total">Price per Unit {ordersCurrency}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        className="сontentTypeF_quantityButton"
                        onClick={() =>
                          setOrderForm({
                            ...orderForm,
                            order_total: handlePriceChange(orderForm.order_total || '0', -1),
                          })
                        }
                      >
                        ←
                      </button>
                      <input
                        id="order_total"
                        type="text"
                        className="сontentTypeF_itemModalFieldInputOrderTotal"
                        value={orderForm.order_total}
                        onChange={(e) => {
                          const validated = validatePriceInput(e.target.value);
                          setOrderForm({ ...orderForm, order_total: validated });
                        }}
                        onBlur={(e) => {
                          setOrderForm({
                            ...orderForm,
                            order_total:
                              e.target.value === '' || e.target.value === '.'
                                ? '0.00'
                                : parseFloat(e.target.value).toFixed(2),
                          });
                        }}
                        placeholder="Price per Unit"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="сontentTypeF_quantityButton"
                        onClick={() =>
                          setOrderForm({
                            ...orderForm,
                            order_total: handlePriceChange(orderForm.order_total || '0', 1),
                          })
                        }
                      >
                        →
                      </button>
                    </div>
                    {errors.order_total && (
                      <span className="error-message">{errors.order_total}</span>
                    )}
                  </div>
                  <div className="сontentTypeF_itemModalField">
                    <label htmlFor="order_amount">Quantity</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        className="сontentTypeF_quantityButton"
                        onClick={() =>
                          setOrderForm({
                            ...orderForm,
                            order_amount: handleQuantityChange(orderForm.order_amount || '1', -1),
                          })
                        }
                      >
                        ←
                      </button>
                      <input
                        id="order_amount"
                        type="text"
                        className="сontentTypeF_itemModalFieldInputOrderAmount"
                        value={orderForm.order_amount}
                        onChange={(e) => {
                          const validated = validateNumberInput(e.target.value);
                          setOrderForm({ ...orderForm, order_amount: validated });
                        }}
                        onBlur={(e) => {
                          setOrderForm({
                            ...orderForm,
                            order_amount:
                              e.target.value === '' ? '1' : String(Number(e.target.value)),
                          });
                        }}
                        placeholder="Quantity"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="сontentTypeF_quantityButton"
                        onClick={() =>
                          setOrderForm({
                            ...orderForm,
                            order_amount: handleQuantityChange(orderForm.order_amount || '1', 1),
                          })
                        }
                      >
                        →
                      </button>
                    </div>
                    {errors.order_amount && (
                      <span className="error-message">{errors.order_amount}</span>
                    )}
                  </div>
                </div>
                <div className="itemModalFieldContainer">
                  <div className="сontentTypeF_itemModalField">
                    <select
                      value={orderForm.order_status}
                      onChange={(e) => setOrderForm({ ...orderForm, order_status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="сontentTypeF_itemModalField">
                    <select
                      value={orderForm.order_direction}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, order_direction: e.target.value })
                      }
                    >
                      <option value="outgoing">Send goods (Receive payment)</option>
                      <option value="incoming">Receive goods (Send payment)</option>
                    </select>
                  </div>
                </div>
                <div className="сontentTypeF_itemModalField">
                  <label>Date</label>
                  <input
                    type="datetime-local"
                    className="сontentTypeF_datetimeInput"
                    value={orderForm.order_date}
                    onChange={(e) => setOrderForm({ ...orderForm, order_date: e.target.value })}
                  />
                </div>
                <div className="сontentTypeF_itemModalField">
                  <textarea
                    value={orderForm.order_note}
                    onChange={(e) => setOrderForm({ ...orderForm, order_note: e.target.value })}
                    rows={4}
                    placeholder="Note"
                  />
                </div>
              </div>
              <div className="сontentTypeF_itemModalFooter">
                <button
                  className="сontentTypeF_modalCancel"
                  onClick={() => setIsOrderModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="сontentTypeF_itemModalSave" onClick={handleSaveOrder}>
                  <strong>{editOrderUid !== null ? 'Save Changes' : 'Add Order'}</strong>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модалка подтверждения */}
        <ConfirmationModal
          isOpen={isConfirmationModalOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          message={'Are you sure you want to delete this order?'}
        />
      </div>
    </div>
  );
};

export default ContentTypeF;

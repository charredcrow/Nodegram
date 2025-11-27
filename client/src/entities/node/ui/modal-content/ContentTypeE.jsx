import React, { useState, useEffect, useRef } from 'react';
import { ConfirmationModal } from '../../../../shared/ui';
import { VscNewFile } from 'react-icons/vsc';
import { CiSearch } from 'react-icons/ci';
import { FaTimes } from 'react-icons/fa';
import { FaEye } from 'react-icons/fa';
import './ContentTypeE.css';

const LOW_STOCK_THRESHOLD = 0;

const ContentTypeE = ({ data, onUpdate, nodesData, links }) => {
  // ... (остальные состояния и функции остаются без изменений)

  const [description, setDescription] = useState(data?.node?.description || '');
  const [isFocused, setIsFocused] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const inputRef = useRef(null);

  const initialInventory = Array.isArray(data.node.content) ? data.node.content : [];
  const [inventory, setInventory] = useState(initialInventory);

  const [sortOrders, setSortOrders] = useState({
    name: 'desc',
    quantity: 'desc',
    price: 'desc',
    date: 'desc',
  });
  const [sortCriteria, setSortCriteria] = useState('date');

  const [newProductName, setNewProductName] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState(1);
  const [newProductPrice, setNewProductPrice] = useState(0);
  const [newProductNote, setNewProductNote] = useState('');

  const [filterName, setFilterName] = useState('');
  const [filterMinQuantity, setFilterMinQuantity] = useState('');
  const [filterMaxQuantity, setFilterMaxQuantity] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkQuantity, setBulkQuantity] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkNote, setBulkNote] = useState('');

  // Для товаров из Orders: переопределения количества (orderId -> новое значение)
  const initialOverrides = data.node.orderOverrides || {};
  const [orderOverrides, setOrderOverrides] = useState(initialOverrides);
  const [deletedOrderIds, setDeletedOrderIds] = useState([]);

  // При изменении orderOverrides обновляем node.orderOverrides через onUpdate
  useEffect(() => {
    onUpdate({ ...data, node: { ...data.node, orderOverrides } });
  }, [orderOverrides]);

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    if (data && data.node) {
      onUpdate({ ...data, node: { ...data.node, description: e.target.value } });
    }
  };

  const updateInventory = (newInventory) => {
    setInventory(newInventory);
    onUpdate({ ...data, node: { ...data.node, content: newInventory } });
  };

  const handleAddProduct = () => {
    if (newProductName.trim() === '' || newProductQuantity < 0) return;
    const newProduct = {
      id: Date.now(), // Уникальный id для ручного товара
      product_name: newProductName,
      product_quantity: newProductQuantity,
      product_price: newProductPrice,
      product_note: newProductNote,
      created_at: new Date().toISOString(),
    };
    const updatedInventory = [...inventory, newProduct];
    updateInventory(updatedInventory);
    setNewProductName('');
    setNewProductQuantity(1);
    setNewProductPrice(0);
    setNewProductNote('');
  };

  const handleProductChange = (inventoryIndex, field, value) => {
    const updatedInventory = [...inventory];
    updatedInventory[inventoryIndex] = { ...updatedInventory[inventoryIndex], [field]: value };
    updateInventory(updatedInventory);
  };

  const handleDeleteProduct = (inventoryIndex) => {
    setItemToDelete(inventoryIndex);
    setIsBulkDelete(false);
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (isBulkDelete) {
      const updatedInventory = inventory.filter((_, i) => !selectedProducts.includes(i));
      updateInventory(updatedInventory);
      setSelectedProducts([]);
    } else if (itemToDelete !== null) {
      const updatedInventory = inventory.filter((_, i) => i !== itemToDelete);
      updateInventory(updatedInventory);
    }
    setItemToDelete(null);
    setIsBulkDelete(false);
    setIsConfirmationModalOpen(false);
  };

  const handleCancelDelete = () => {
    setItemToDelete(null);
    setIsBulkDelete(false);
    setIsConfirmationModalOpen(false);
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length > 0) {
      setIsBulkDelete(true);
      setIsConfirmationModalOpen(true);
    }
  };

  const handleSelectProduct = (inventoryIndex, isSelected) => {
    if (isSelected) {
      setSelectedProducts([...selectedProducts, inventoryIndex]);
    } else {
      setSelectedProducts(selectedProducts.filter((i) => i !== inventoryIndex));
    }
  };

  const handleBulkEdit = () => {
    const updatedInventory = [...inventory];
    selectedProducts.forEach((invIndex) => {
      if (bulkQuantity !== '') {
        updatedInventory[invIndex].product_quantity = Number(bulkQuantity);
      }
      if (bulkPrice !== '') {
        updatedInventory[invIndex].product_price = Number(bulkPrice);
      }
      if (bulkNote !== '') {
        updatedInventory[invIndex].product_note = bulkNote;
      }
    });
    updateInventory(updatedInventory);
    setBulkQuantity('');
    setBulkPrice('');
    setBulkNote('');
    setSelectedProducts([]);
  };

  // --- Логика интеграции с системой Orders ---
  // Для Items (typeE): ищем ссылки, где link.target === data.node.id.
  // const connectedOrdersSourceIds = (links || [])
  const connectedOrdersSourceIds = []
    .filter((link) => link.target === data.node.id)
    .map((link) => link.source);

  // Из nodesData выбираем узлы Orders (typeF) с нужными id,
  // и из их content выбираем заказы со статусом Delivered (если orderId не удален),
  // затем создаём объекты товаров. В поле created_at берём order.order_date.
  const connectedOrderItems = (nodesData || [])
    .filter((node) => connectedOrdersSourceIds.includes(node.id) && node.type === 'typeF')
    .flatMap((node) => {
      if (Array.isArray(node.content)) {
        return node.content
          .filter(
            (order) =>
              order.order_status === 'Delivered' && !deletedOrderIds.includes(order.order_id)
          )
          .map((order) => ({
            product_name: order.order_name,
            product_quantity:
              orderOverrides[order.order_id] !== undefined
                ? orderOverrides[order.order_id]
                : order.order_amount,
            product_price: order.order_total,
            product_note: order.order_note,
            created_at: order.order_date,
            // Здесь для order items разрешаем редактирование только количества
            readOnly: false,
            orderId: order.order_id,
            isOrderItem: true,
          }));
      }
      return [];
    });

  // Для ручных товаров задаем created_at, если его нет, и объединяем с товарами из Orders.
  const manualItems = inventory.map((item) => ({
    ...item,
    created_at: item.created_at || new Date().toISOString(),
  }));
  const allItems = [...manualItems, ...connectedOrderItems];

  // Фильтрация объединённого списка по критериям, включая фильтр по дате (created_at)
  const filteredItems = allItems.filter((item) => {
    const matchName =
      filterName.trim() === '' ||
      item.product_name.toLowerCase().includes(filterName.toLowerCase());
    const matchMinQuantity =
      filterMinQuantity === '' || item.product_quantity >= Number(filterMinQuantity);
    const matchMaxQuantity =
      filterMaxQuantity === '' || item.product_quantity <= Number(filterMaxQuantity);
    const matchMinPrice = filterMinPrice === '' || item.product_price >= Number(filterMinPrice);
    const matchMaxPrice = filterMaxPrice === '' || item.product_price <= Number(filterMaxPrice);
    const itemDate = new Date(item.created_at);
    let dateMatch = true;
    if (filterStartDate) {
      dateMatch = dateMatch && itemDate >= new Date(filterStartDate);
    }
    if (filterEndDate) {
      dateMatch = dateMatch && itemDate <= new Date(filterEndDate);
    }
    return (
      matchName &&
      matchMinQuantity &&
      matchMaxQuantity &&
      matchMinPrice &&
      matchMaxPrice &&
      dateMatch
    );
  });

  // Сортировка объединённого списка, если выбран критерий сортировки.
  const sortedItems = sortCriteria
    ? [...filteredItems].sort((a, b) => {
        let comp = 0;
        if (sortCriteria === 'name') {
          comp = a.product_name.localeCompare(b.product_name);
        } else if (sortCriteria === 'quantity') {
          comp = a.product_quantity - b.product_quantity;
        } else if (sortCriteria === 'price') {
          comp = a.product_price - b.product_price;
        } else if (sortCriteria === 'date') {
          comp = new Date(a.created_at) - new Date(b.created_at);
        }
        return sortOrders[sortCriteria] === 'asc' ? comp : -comp;
      })
    : filteredItems;

  const handleSortCriteria = (criteria) => {
    if (sortCriteria === criteria) {
      setSortOrders((prev) => ({ ...prev, [criteria]: prev[criteria] === 'asc' ? 'desc' : 'asc' }));
    } else {
      setSortCriteria(criteria);
    }
  };

  const handleResetSort = () => {
    setSortCriteria('date');
    setFilterName('');
    setFilterMinQuantity('');
    setFilterMaxQuantity('');
    setFilterMinPrice('');
    setFilterMaxPrice('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const totalInventoryValue = allItems.reduce(
    (acc, item) => acc + item.product_quantity * item.product_price,
    0
  );

  // Inline стиль для инпутов
  const inputStyle = {}; // maxWidth: "150px"

  // --- Вычисление валюты ---
  // Если Items соединён с Orders, а Orders соединён с Finance, то можно попытаться найти Finance‑блок и взять его валюту.
  // Также проверяем прямое соединение между Finance и Inventory
  const currentItemsId = data.node.id;

  // 1. Проверяем прямое соединение с Finance
  const directFinanceLinks = (links || []).filter(
    (link) => link.source === currentItemsId || link.target === currentItemsId
  );

  const directFinanceNodes = (nodesData || []).filter((node) =>
    directFinanceLinks.some(
      (link) => (link.source === node.id || link.target === node.id) && node.type === 'typeG'
    )
  );

  let financeCurrency = null;

  // Если есть прямое соединение с Finance, берем валюту оттуда
  if (directFinanceNodes.length > 0) {
    financeCurrency = directFinanceNodes[0].currency || 'USD';
  } else {
    // 2. Если прямого соединения нет, проверяем через Orders
    const ordersIds = (links || [])
      .filter((link) => link.target === currentItemsId)
      .map((link) => link.source);

    // Для каждого Orders‑блока ищем Finance‑блоки, где Orders является target
    for (const orderId of ordersIds) {
      const financeLinks = (links || []).filter((link) => link.target === orderId);
      const financeNodes = (nodesData || []).filter(
        (node) => financeLinks.some((link) => link.source === node.id) && node.type === 'typeG'
      );
      if (financeNodes.length > 0) {
        financeCurrency = financeNodes[0].currency || 'USD';
        break;
      }
    }
  }

  const itemsCurrency = financeCurrency || data.node.currency || 'USD';

  // Add state for modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  // Функция для валидации и форматирования числового ввода (целое число)
  const validateNumberInput = (value) => {
    const numbersOnly = value.replace(/[^\d]/g, '');
    return numbersOnly === '' ? '0' : numbersOnly;
  };

  // Функция для валидации цены (до 2 знаков после точки)
  const validatePriceInput = (value) => {
    // Разрешаем только цифры и одну точку, максимум 2 знака после точки
    let val = value.replace(/[^\d.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    if (parts[1]) val = parts[0] + '.' + parts[1].slice(0, 2);
    return val;
  };

  // Функция для изменения количества с помощью стрелок
  const handleQuantityChange = (currentValue, change) => {
    const newValue = Math.max(0, parseInt(currentValue) + change);
    return newValue.toString();
  };

  // Функция для изменения цены с помощью стрелок (шаг 1.00)
  const handlePriceChange = (currentValue, change) => {
    let val = parseFloat(currentValue);
    if (isNaN(val)) val = 0;
    let newValue = Math.max(0, val + change);
    return newValue.toFixed(2);
  };

  const [editingPrice, setEditingPrice] = useState(null); // для модального окна
  const [editingNewPrice, setEditingNewPrice] = useState(null); // для модального окна добавления

  if (!data || !data.node) {
    return <div>Error: Invalid data</div>;
  }

  return (
    <div className="сontentType_container">
      <div className="сontentType_inputContainer">
        {/* Header Section */}
        <div className="сontentTypeE_header">
          <div className="сontentTypeE_headerLeft">
            <h2 className="сontentTypeE_title">Inventory</h2>
            <div className="сontentTypeE_headerInfo">
              <span className="сontentTypeE_subtitle">{allItems.length} items</span>
              <span className="сontentTypeE_subtitle">
                Total value: {totalInventoryValue.toFixed(2)} {itemsCurrency}
              </span>
            </div>
          </div>
          <div className="сontentTypeE_headerRight">
            <button className="сontentTypeE_addButton" onClick={() => setIsAddModalOpen(true)}>
              <strong>Add item </strong>
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="сontentTypeE_analytics"></div>

        {/* Search and Filter Section */}
        <div className="сontentTypeE_searchFilter">
          <div className="сontentTypeE_search">
            <CiSearch />
            <input
              type="text"
              placeholder="Search items..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </div>
          <div className="сontentTypeE_filterButtons">
            <button
              className={`сontentTypeE_filterButton ${isFilterVisible ? 'active' : ''}`}
              onClick={() => setIsFilterVisible(!isFilterVisible)}
            >
              Filter
            </button>
            <button className="сontentTypeE_filterButton" onClick={handleResetSort}>
              Reset
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {isFilterVisible && (
          <div className="сontentTypeE_filterPanel">
            <div className="сontentTypeE_filterGrid">
              <div className="сontentTypeE_filterGroup">
                <label>Quantity Range</label>
                <div className="сontentTypeE_filterInputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filterMinQuantity}
                    onChange={(e) => setFilterMinQuantity(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filterMaxQuantity}
                    onChange={(e) => setFilterMaxQuantity(e.target.value)}
                  />
                </div>
              </div>
              <div className="сontentTypeE_filterGroup">
                <label>Price Range</label>
                <div className="сontentTypeE_filterInputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filterMinPrice}
                    onChange={(e) => setFilterMinPrice(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="сontentTypeE_filterGroup">
                <label>Date Range</label>
                <div className="сontentTypeE_filterInputs">
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                  />
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Edit Panel */}
        {selectedProducts.length > 0 && (
          <div className="сontentTypeE_bulkEditPanel">
            <div className="сontentTypeE_itemModalHeader">
              <h3>Bulk Edit Selected Items ({selectedProducts.length})</h3>
            </div>
            <div className="сontentTypeE_itemModalBody">
              <div className="itemModalFieldContainer">
                <div className="сontentTypeE_itemModalField">
                  <label>Quantity</label>
                  <div className="сontentTypeE_quantityInput">
                    <button
                      className="сontentTypeE_quantityButton"
                      onClick={() => {
                        const newQuantity = handleQuantityChange(bulkQuantity || '0', -1);
                        setBulkQuantity(newQuantity);
                      }}
                    >
                      ←
                    </button>
                    <input
                      type="text"
                      value={bulkQuantity}
                      onChange={(e) => {
                        const validatedValue = validateNumberInput(e.target.value);
                        setBulkQuantity(validatedValue);
                      }}
                      onBlur={() => {
                        setBulkQuantity((prev) => (prev === '' ? '0' : String(Number(prev))));
                      }}
                      placeholder="Set quantity for all"
                      inputMode="numeric"
                    />
                    <button
                      className="сontentTypeE_quantityButton"
                      onClick={() => {
                        const newQuantity = handleQuantityChange(bulkQuantity || '0', 1);
                        setBulkQuantity(newQuantity);
                      }}
                    >
                      →
                    </button>
                  </div>
                </div>
                <div className="сontentTypeE_itemModalField">
                  <label>Price per Unit</label>
                  <div className="сontentTypeE_quantityInput">
                    <button
                      className="сontentTypeE_quantityButton"
                      onClick={() => {
                        const newPrice = handlePriceChange(bulkPrice || '0', -1);
                        setBulkPrice(newPrice);
                      }}
                    >
                      ←
                    </button>
                    <input
                      type="text"
                      value={bulkPrice !== '' ? bulkPrice : Number(bulkPrice || 0).toFixed(2)}
                      onChange={(e) => {
                        const validatedValue = validatePriceInput(e.target.value);
                        setBulkPrice(validatedValue);
                      }}
                      onBlur={() => {
                        setBulkPrice((prev) => {
                          if (prev === '' || prev === '.') return '0.00';
                          return parseFloat(prev).toFixed(2);
                        });
                      }}
                      placeholder="Set price for all"
                    />
                    <button
                      className="сontentTypeE_quantityButton"
                      onClick={() => {
                        const newPrice = handlePriceChange(bulkPrice || '0', 1);
                        setBulkPrice(newPrice);
                      }}
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
              <div className="сontentTypeE_itemModalField">
                <label>Note</label>
                <textarea
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                  placeholder="Set note for all"
                  rows={3}
                />
              </div>
            </div>
            <div className="сontentTypeE_itemModalFooter">
              <button className="сontentTypeE_itemModalSave" onClick={handleBulkEdit}>
                Apply Changes
              </button>
              <button className="сontentTypeE_deleteButton" onClick={handleBulkDelete}>
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Inventory Grid */}
        <div className="сontentTypeE_inventoryGrid">
          <div className="сontentTypeE_gridHeaderContent">
            <div className="сontentTypeE_gridCheckbox">
              <input
                type="checkbox"
                checked={selectedProducts.length === sortedItems.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedProducts(sortedItems.map((_, i) => i));
                  } else {
                    setSelectedProducts([]);
                  }
                }}
              />
            </div>
            <div
              className="сontentTypeE_gridHeaderCell srtby"
              onClick={() => handleSortCriteria('name')}
            >
              <span>Name</span>
              {sortCriteria === 'name' && (sortOrders.name === 'asc' ? '↑' : '↓')}
            </div>
            <div
              className="сontentTypeE_gridHeaderCell srtby"
              onClick={() => handleSortCriteria('quantity')}
            >
              <span>Quantity</span>
              {sortCriteria === 'quantity' && (sortOrders.quantity === 'asc' ? '↑' : '↓')}
            </div>
            <div
              className="сontentTypeE_gridHeaderCell srtby"
              onClick={() => handleSortCriteria('price')}
            >
              <span>Price</span>
              {sortCriteria === 'price' && (sortOrders.price === 'asc' ? '↑' : '↓')}
            </div>
            <div
              className="сontentTypeE_gridHeaderCell srtby"
              onClick={() => handleSortCriteria('date')}
            >
              <span>Date</span>
              {sortCriteria === 'date' && (sortOrders.date === 'asc' ? '↑' : '↓')}
            </div>
          </div>

          {/* Existing inventory items mapping */}
          {sortedItems.map((product, i) => {
            if (product.isOrderItem) {
              return (
                <div key={i} className="сontentTypeE_inventoryItem">
                  <input type="checkbox" checked={false} disabled />
                  <div className="сontentTypeE_inventoryItemContent">
                    <span className="сontentTypeE_inventoryItemName">{product.product_name}</span>
                    <span className="сontentTypeE_inventoryItemQuantity">
                      Quantity: {product.product_quantity}
                    </span>
                  </div>
                  <div className="сontentTypeE_inventoryItemPrice">
                    {Number(product.product_price).toFixed(2)} {itemsCurrency}
                  </div>
                  <div className="сontentTypeE_inventoryItemActions">
                    <button
                      className="сontentTypeE_viewButton"
                      onClick={() => {
                        setSelectedItem(product);
                        setIsItemModalOpen(true);
                      }}
                    >
                      <FaEye />
                    </button>
                    <button
                      className="сontentTypeE_deleteButton"
                      onClick={() => setDeletedOrderIds((prev) => [...prev, product.orderId])}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            } else {
              const manualIndex = inventory.findIndex((item) => item.id === product.id);
              return (
                <div key={i} className="сontentTypeE_inventoryItem">
                  <input
                    type="checkbox"
                    checked={manualIndex !== -1 && selectedProducts.includes(manualIndex)}
                    onChange={(e) => {
                      if (manualIndex !== -1) {
                        handleSelectProduct(manualIndex, e.target.checked);
                      }
                    }}
                  />
                  <div className="сontentTypeE_inventoryItemContent">
                    <span className="сontentTypeE_inventoryItemName">{product.product_name}</span>
                    <span className="сontentTypeE_inventoryItemQuantity">
                      Quantity: {product.product_quantity}
                    </span>
                  </div>
                  <div className="сontentTypeE_inventoryItemPrice">
                    {Number(product.product_price).toFixed(2)} {itemsCurrency}
                  </div>
                  <div className="сontentTypeE_inventoryItemActions">
                    <button
                      className="сontentTypeE_viewButton"
                      onClick={() => {
                        setSelectedItem(product);
                        setIsItemModalOpen(true);
                      }}
                    >
                      <FaEye />
                    </button>
                    <button
                      className="сontentTypeE_deleteButton"
                      onClick={() => handleDeleteProduct(manualIndex)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            }
          })}
        </div>

        {/* Add Item Modal */}
        {isAddModalOpen && (
          <div className="сontentTypeE_itemModalOverlay" onClick={() => setIsAddModalOpen(false)}>
            <div className="сontentTypeE_itemModalContent" onClick={(e) => e.stopPropagation()}>
              <div className="сontentTypeE_itemModalHeader">
                <h3>New Item</h3>
                <button
                  className="сontentTypeE_itemModalClose"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="сontentTypeE_itemModalBody">
                <div className="сontentTypeE_itemModalField">
                  <input
                    id="newProductName"
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Product Name"
                    maxLength={20}
                  />
                </div>
                <div className="itemModalFieldContainer">
                  <div className="сontentTypeE_itemModalField">
                    <label htmlFor="newProductQuantity">Quantity</label>
                    <div className="сontentTypeE_quantityInput">
                      <button
                        className="сontentTypeE_quantityButton"
                        onClick={() =>
                          setNewProductQuantity(Math.max(0, Number(newProductQuantity) - 1))
                        }
                        type="button"
                      >
                        ←
                      </button>
                      <input
                        id="newProductQuantity"
                        type="text"
                        value={newProductQuantity}
                        onChange={(e) => {
                          const validatedValue = validateNumberInput(e.target.value);
                          setNewProductQuantity(validatedValue);
                        }}
                        onBlur={() => {
                          setNewProductQuantity((prev) =>
                            prev === '' ? '0' : String(Number(prev))
                          );
                        }}
                        inputMode="numeric"
                      />
                      <button
                        className="сontentTypeE_quantityButton"
                        onClick={() =>
                          setNewProductQuantity(Math.max(0, Number(newProductQuantity) + 1))
                        }
                        type="button"
                      >
                        →
                      </button>
                    </div>
                  </div>
                  <div className="сontentTypeE_itemModalField">
                    <label htmlFor="newProductPrice">Price per Unit</label>
                    <div className="сontentTypeE_quantityInput">
                      <button
                        className="сontentTypeE_quantityButton"
                        onClick={() =>
                          setNewProductPrice(Number(handlePriceChange(newProductPrice || '0', -1)))
                        }
                        type="button"
                      >
                        ←
                      </button>
                      <input
                        id="newProductPrice"
                        type="text"
                        value={
                          editingNewPrice !== null
                            ? editingNewPrice
                            : Number(newProductPrice || 0).toFixed(2)
                        }
                        onChange={(e) => {
                          const newPrice = validatePriceInput(e.target.value);
                          setEditingNewPrice(newPrice);
                        }}
                        onBlur={() => {
                          if (editingNewPrice !== null) {
                            setNewProductPrice(
                              editingNewPrice === '' || editingNewPrice === '.'
                                ? '0.00'
                                : parseFloat(editingNewPrice).toFixed(2)
                            );
                            setEditingNewPrice(null);
                          }
                        }}
                      />
                      <button
                        className="сontentTypeE_quantityButton"
                        onClick={() =>
                          setNewProductPrice(Number(handlePriceChange(newProductPrice || '0', 1)))
                        }
                        type="button"
                      >
                        →
                      </button>
                    </div>
                  </div>
                </div>
                <div className="сontentTypeE_itemModalField">
                  <textarea
                    id="newProductNote"
                    value={newProductNote}
                    onChange={(e) => setNewProductNote(e.target.value)}
                    placeholder="Note about this item"
                    rows={8}
                  />
                </div>
              </div>
              <div className="сontentTypeE_itemModalFooter">
                <button
                  className="сontentTypeE_modalCancel"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="сontentTypeE_itemModalSave"
                  onClick={() => {
                    handleAddProduct();
                    setIsAddModalOpen(false);
                  }}
                >
                  <strong>Save Item</strong>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Item Details Modal */}
        {isItemModalOpen && selectedItem && (
          <div
            className="сontentTypeE_itemModalOverlay"
            onClick={(e) => {
              if (selectedItem.product_name.trim()) {
                setIsItemModalOpen(false);
              }
            }}
          >
            <div className="сontentTypeE_itemModalContent" onClick={(e) => e.stopPropagation()}>
              <div className="сontentTypeE_itemModalHeader">
                <h3>Item Details</h3>
                <button
                  className="сontentTypeE_itemModalClose"
                  onClick={() => {
                    if (selectedItem.product_name.trim()) {
                      setIsItemModalOpen(false);
                    }
                  }}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="сontentTypeE_itemModalBody">
                <div className="сontentTypeE_itemModalField">
                  <input
                    type="text"
                    placeholder="Product Name *"
                    value={selectedItem.product_name}
                    onChange={(e) => {
                      if (!selectedItem.isOrderItem) {
                        const manualIndex = inventory.findIndex(
                          (item) => item.id === selectedItem.id
                        );
                        if (manualIndex !== -1) {
                          const newName = e.target.value.slice(0, 25);
                          handleProductChange(manualIndex, 'product_name', newName);
                          setSelectedItem((prev) => ({ ...prev, product_name: newName }));
                        }
                      }
                    }}
                    maxLength={25}
                    disabled={selectedItem.isOrderItem}
                  />
                </div>
                <div className="itemModalFieldContainer">
                  <div className="сontentTypeE_itemModalField">
                    <label>Quantity</label>
                    <div className="сontentTypeE_quantityInput">
                      <button
                        className="сontentTypeE_quantityButton"
                        onClick={() => {
                          if (!selectedItem.isOrderItem) {
                            const manualIndex = inventory.findIndex(
                              (item) => item.id === selectedItem.id
                            );
                            if (manualIndex !== -1) {
                              const newQuantity = handleQuantityChange(
                                selectedItem.product_quantity,
                                -1
                              );
                              handleProductChange(
                                manualIndex,
                                'product_quantity',
                                parseInt(newQuantity)
                              );
                              setSelectedItem((prev) => ({
                                ...prev,
                                product_quantity: parseInt(newQuantity),
                              }));
                            }
                          }
                        }}
                      >
                        ←
                      </button>
                      <input
                        id="productQuantityDetail"
                        type="text"
                        value={selectedItem.product_quantity}
                        onChange={(e) => {
                          const validatedValue = validateNumberInput(e.target.value);
                          if (selectedItem.isOrderItem) {
                            // Если текущее значение 0 и пользователь вводит новое число, заменяем 0
                            if (selectedItem.product_quantity === 0 && validatedValue !== '0') {
                              setOrderOverrides((prev) => ({
                                ...prev,
                                [selectedItem.orderId]: parseInt(validatedValue),
                              }));
                              setSelectedItem((prev) => ({
                                ...prev,
                                product_quantity: parseInt(validatedValue),
                              }));
                            } else {
                              setOrderOverrides((prev) => ({
                                ...prev,
                                [selectedItem.orderId]: parseInt(validatedValue),
                              }));
                              setSelectedItem((prev) => ({
                                ...prev,
                                product_quantity: parseInt(validatedValue),
                              }));
                            }
                          } else {
                            const manualIndex = inventory.findIndex(
                              (item) => item.id === selectedItem.id
                            );
                            if (manualIndex !== -1) {
                              // Если текущее значение 0 и пользователь вводит новое число, заменяем 0
                              if (selectedItem.product_quantity === 0 && validatedValue !== '0') {
                                handleProductChange(
                                  manualIndex,
                                  'product_quantity',
                                  parseInt(validatedValue)
                                );
                                setSelectedItem((prev) => ({
                                  ...prev,
                                  product_quantity: parseInt(validatedValue),
                                }));
                              } else {
                                handleProductChange(
                                  manualIndex,
                                  'product_quantity',
                                  parseInt(validatedValue)
                                );
                                setSelectedItem((prev) => ({
                                  ...prev,
                                  product_quantity: parseInt(validatedValue),
                                }));
                              }
                            }
                          }
                        }}
                      />
                      <button
                        className="сontentTypeE_quantityButton"
                        onClick={() => {
                          if (!selectedItem.isOrderItem) {
                            const manualIndex = inventory.findIndex(
                              (item) => item.id === selectedItem.id
                            );
                            if (manualIndex !== -1) {
                              const newQuantity = handleQuantityChange(
                                selectedItem.product_quantity,
                                1
                              );
                              handleProductChange(
                                manualIndex,
                                'product_quantity',
                                parseInt(newQuantity)
                              );
                              setSelectedItem((prev) => ({
                                ...prev,
                                product_quantity: parseInt(newQuantity),
                              }));
                            }
                          } else {
                            const newQuantity = handleQuantityChange(
                              selectedItem.product_quantity,
                              1
                            );
                            setOrderOverrides((prev) => ({
                              ...prev,
                              [selectedItem.orderId]: parseInt(newQuantity),
                            }));
                            setSelectedItem((prev) => ({
                              ...prev,
                              product_quantity: parseInt(newQuantity),
                            }));
                          }
                        }}
                      >
                        →
                      </button>
                    </div>
                  </div>
                  <div className="сontentTypeE_itemModalField">
                    <label>Price per Unit</label>
                    <div className="сontentTypeE_quantityInput">
                      <button
                        className="сontentTypeE_quantityButton"
                        onClick={() => {
                          if (!selectedItem.isOrderItem) {
                            const manualIndex = inventory.findIndex(
                              (item) => item.id === selectedItem.id
                            );
                            if (manualIndex !== -1) {
                              const newPrice = handlePriceChange(
                                editingPrice ?? selectedItem.product_price,
                                -1
                              );
                              handleProductChange(
                                manualIndex,
                                'product_price',
                                parseFloat(newPrice)
                              );
                              setSelectedItem((prev) => ({
                                ...prev,
                                product_price: parseFloat(newPrice),
                              }));
                              setEditingPrice(newPrice);
                            }
                          }
                        }}
                      >
                        ←
                      </button>
                      <input
                        id="productPriceDetail"
                        type="text"
                        value={
                          editingPrice !== null
                            ? editingPrice
                            : Number(selectedItem.product_price).toFixed(2)
                        }
                        onChange={(e) => {
                          if (!selectedItem.isOrderItem) {
                            const newPrice = validatePriceInput(e.target.value);
                            // Если текущее значение 0 и пользователь вводит новое число, заменяем 0
                            if (selectedItem.product_price === 0 && newPrice !== '0') {
                              setEditingPrice(newPrice);
                            } else {
                              setEditingPrice(newPrice);
                            }
                          }
                        }}
                        onBlur={() => {
                          if (!selectedItem.isOrderItem && editingPrice !== null) {
                            const manualIndex = inventory.findIndex(
                              (item) => item.id === selectedItem.id
                            );
                            if (manualIndex !== -1) {
                              handleProductChange(
                                manualIndex,
                                'product_price',
                                parseFloat(editingPrice) || 0
                              );
                              setSelectedItem((prev) => ({
                                ...prev,
                                product_price: parseFloat(editingPrice) || 0,
                              }));
                            }
                            setEditingPrice(null);
                          }
                        }}
                        disabled={selectedItem.isOrderItem}
                      />
                      <button
                        className="сontentTypeE_quantityButton"
                        onClick={() => {
                          if (!selectedItem.isOrderItem) {
                            const manualIndex = inventory.findIndex(
                              (item) => item.id === selectedItem.id
                            );
                            if (manualIndex !== -1) {
                              const newPrice = handlePriceChange(
                                editingPrice ?? selectedItem.product_price,
                                1
                              );
                              handleProductChange(
                                manualIndex,
                                'product_price',
                                parseFloat(newPrice)
                              );
                              setSelectedItem((prev) => ({
                                ...prev,
                                product_price: parseFloat(newPrice),
                              }));
                              setEditingPrice(newPrice);
                            }
                          }
                        }}
                      >
                        →
                      </button>
                    </div>
                  </div>
                </div>
                <div className="сontentTypeE_itemModalField">
                  <textarea
                    rows={8}
                    placeholder="Note about this item"
                    value={selectedItem.product_note || ''}
                    onChange={(e) => {
                      if (!selectedItem.isOrderItem) {
                        const manualIndex = inventory.findIndex(
                          (item) => item.id === selectedItem.id
                        );
                        if (manualIndex !== -1) {
                          handleProductChange(manualIndex, 'product_note', e.target.value);
                          setSelectedItem((prev) => ({ ...prev, product_note: e.target.value }));
                        }
                      }
                    }}
                    disabled={selectedItem.isOrderItem}
                  />
                </div>
                <div className="сontentTypeE_itemModalField">
                  <label>Created At</label>
                  <span>{new Date(selectedItem.created_at).toLocaleDateString()}</span>
                </div>
                {selectedItem.isOrderItem && (
                  <div className="сontentTypeE_itemModalField">
                    <label>Order ID</label>
                    <input type="text" value={selectedItem.orderId} disabled />
                  </div>
                )}
              </div>
              <div className="сontentTypeE_itemModalFooter gfr1">
                <button
                  className="сontentTypeE_itemModalSave"
                  onClick={() => {
                    if (selectedItem.product_name.trim()) {
                      setIsItemModalOpen(false);
                    }
                  }}
                >
                  <strong>Save Changes</strong>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing modals */}
        <ConfirmationModal
          isOpen={isConfirmationModalOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          message={
            isBulkDelete
              ? 'Are you sure you want to delete the selected items?'
              : 'Are you sure you want to delete this item?'
          }
        />
      </div>
    </div>
  );
};

export default ContentTypeE;

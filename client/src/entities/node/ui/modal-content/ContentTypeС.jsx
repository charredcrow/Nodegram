import React, { useState, useEffect, useRef } from 'react';
import './ContentTypeС.css';

const ContentTypeC = ({ data, onUpdate, nodesData, links, openNodeModal }) => {
  const [description, setDescription] = useState(data?.node?.description || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [teamUsers, setTeamUsers] = useState([]);
  const [draggedUser, setDraggedUser] = useState(null);
  const [focusedRoleInput, setFocusedRoleInput] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    if (data && data.node) {
      onUpdate({ ...data, node: { ...data.node, description: e.target.value } });
    }
  };

  const handleRoleChange = (userId, newRole) => {
    const updatedTeamUsers = teamUsers.map((user) =>
      user.id === userId ? { ...user, role: newRole } : user
    );

    setTeamUsers(updatedTeamUsers);

    if (data && data.node) {
      onUpdate({
        ...data,
        node: {
          ...data.node,
          content: {
            ...data.node.content,
            usersTeam: updatedTeamUsers,
          },
        },
      });
    }
  };

  const handleDragStart = (user) => {
    setDraggedUser(user);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Разрешаем drop
  };

  const handleDrop = (targetUser) => {
    if (!draggedUser || draggedUser.id === targetUser.id) return;

    const updatedTeamUsers = [...teamUsers];
    const draggedIndex = updatedTeamUsers.findIndex((user) => user.id === draggedUser.id);
    const targetIndex = updatedTeamUsers.findIndex((user) => user.id === targetUser.id);

    // Удаляем перетаскиваемого пользователя из списка
    const [removedUser] = updatedTeamUsers.splice(draggedIndex, 1);

    // Вставляем перетаскиваемого пользователя перед/после целевого
    updatedTeamUsers.splice(targetIndex, 0, removedUser);

    // Пересчитываем roleRank
    const reorderedUsers = updatedTeamUsers.map((user, index) => ({
      ...user,
      roleRank: index + 1,
    }));

    setTeamUsers(reorderedUsers);

    if (data && data.node) {
      onUpdate({
        ...data,
        node: {
          ...data.node,
          content: {
            ...data.node.content,
            usersTeam: reorderedUsers,
          },
        },
      });
    }

    setDraggedUser(null);
  };

  const handleMoveUp = (userId) => {
    const currentIndex = teamUsers.findIndex((user) => user.id === userId);
    if (currentIndex > 0) {
      const updatedTeamUsers = [...teamUsers];
      const currentUser = updatedTeamUsers[currentIndex];
      const prevUser = updatedTeamUsers[currentIndex - 1];

      // Сохраняем roleRank для обоих пользователей
      const currentRoleRank = currentUser.roleRank;
      const prevRoleRank = prevUser.roleRank;

      // Меняем местами только необходимые данные
      updatedTeamUsers[currentIndex] = {
        ...prevUser,
        roleRank: currentRoleRank,
      };
      updatedTeamUsers[currentIndex - 1] = {
        ...currentUser,
        roleRank: prevRoleRank,
      };

      setTeamUsers(updatedTeamUsers);

      if (data && data.node) {
        onUpdate({
          ...data,
          node: {
            ...data.node,
            content: {
              ...data.node.content,
              usersTeam: updatedTeamUsers,
            },
          },
        });
      }
    }
  };

  const handleMoveDown = (userId) => {
    const currentIndex = teamUsers.findIndex((user) => user.id === userId);
    if (currentIndex < teamUsers.length - 1) {
      const updatedTeamUsers = [...teamUsers];
      const currentUser = updatedTeamUsers[currentIndex];
      const nextUser = updatedTeamUsers[currentIndex + 1];

      // Сохраняем roleRank для обоих пользователей
      const currentRoleRank = currentUser.roleRank;
      const nextRoleRank = nextUser.roleRank;

      // Меняем местами только необходимые данные
      updatedTeamUsers[currentIndex] = {
        ...nextUser,
        roleRank: currentRoleRank,
      };
      updatedTeamUsers[currentIndex + 1] = {
        ...currentUser,
        roleRank: nextRoleRank,
      };

      setTeamUsers(updatedTeamUsers);

      if (data && data.node) {
        onUpdate({
          ...data,
          node: {
            ...data.node,
            content: {
              ...data.node.content,
              usersTeam: updatedTeamUsers,
            },
          },
        });
      }
    }
  };

  const handleRoleFocus = (userId) => {
    setFocusedRoleInput(userId);
  };

  const handleRoleBlur = () => {
    setFocusedRoleInput(null);
  };

  useEffect(() => {
    if (!data || !data.node) return;

    const currentNodeId = data.node.id;

    // Найти все target, где source === currentNodeId
    const connectedTargets = links
      .filter((link) => link.source === currentNodeId)
      .map((link) => link.target);

    // Найти все узлы с type === "typeD" из nodesData
    const connectedNodes = nodesData.filter(
      (node) => connectedTargets.includes(node.id) && node.type === 'typeD'
    );

    if (connectedNodes.length === 0) {
      setTeamUsers([]); // Оставить список пустым
      return;
    }

    const maxRoleRank = teamUsers.reduce((max, user) => Math.max(max, user.roleRank || 0), 0);

    const updatedTeamUsers = connectedNodes.map((node, index) => {
      const existingUser = data.node.content?.usersTeam?.find((user) => user.id === node.id);
      return (
        existingUser || {
          id: node.id,
          role: 'New Role',
          roleRank: maxRoleRank + index + 1,
        }
      );
    });

    updatedTeamUsers.sort((a, b) => a.roleRank - b.roleRank);

    setTeamUsers(updatedTeamUsers);
  }, [data, links, nodesData]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(teamUsers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = teamUsers.filter((user) => {
        const userName = getUserNameById(user.id).toLowerCase();
        const userEmail = getUserEmailById(user.id).toLowerCase();
        const userRole = user.role.toLowerCase();
        return userName.includes(query) || userEmail.includes(query) || userRole.includes(query);
      });
      setFilteredUsers(filtered);
    }
  }, [searchQuery, teamUsers]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchReset = () => {
    setSearchQuery('');
  };

  const getUserNameById = (id) => {
    const userNode = nodesData.find((node) => node.id === id);
    return userNode ? userNode.title : 'Unknown User';
  };

  const getUserEmailById = (id) => {
    const userNode = nodesData.find((node) => node.id === id);
    if (!userNode || !userNode.content) return 'Email not available';

    // Проверяем разные возможные пути к email
    if (userNode.content.email) return userNode.content.email;
    if (userNode.content.contacts?.email) return userNode.content.contacts.email;
    if (userNode.content.user?.email) return userNode.content.user.email;

    return 'Email not available';
  };

  const handleUserClick = (e, userId) => {
    // Предотвращаем всплытие события, если клик был по кнопкам или полю ввода
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'BUTTON' ||
      e.target.className.includes('сontentTypeC_moveButton')
    ) {
      return;
    }

    // Открываем модальное окно для выбранного пользователя
    openNodeModal(userId);
  };

  const handleEmailClick = (e, email) => {
    e.stopPropagation();
    if (!email || email === 'Email not available') return;

    setSelectedEmail(email);
    setShowEmailModal(true);
  };

  const handleSelectModeToggle = () => {
    setIsSelectMode(!isSelectMode);
    if (!isSelectMode) {
      setSelectedUsers(new Set());
    }
  };

  const resetSelection = () => {
    setIsSelectMode(false);
    setSelectedUsers(new Set());
    setShowEmailModal(false);
    setSelectedEmail(null);
  };

  const handleUserSelect = (e, userId) => {
    e.stopPropagation();
    if (!isSelectMode) return;

    const newSelectedUsers = new Set(selectedUsers);
    if (newSelectedUsers.has(userId)) {
      newSelectedUsers.delete(userId);
    } else {
      newSelectedUsers.add(userId);
    }
    setSelectedUsers(newSelectedUsers);
  };

  const handleGroupEmailSend = () => {
    const selectedEmails = Array.from(selectedUsers)
      .map((id) => getUserEmailById(id))
      .filter((email) => email && email !== 'Email not available');

    if (selectedEmails.length === 0) return;

    setSelectedEmail(selectedEmails.join(','));
    setShowEmailModal(true);
  };

  const handleEmailServiceSelect = (service) => {
    if (!selectedEmail) return;

    let mailtoLink = '';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    switch (service) {
      case 'gmail':
        if (isMobile) {
          mailtoLink = `googlegmail:///co?to=${selectedEmail}`;
          setTimeout(() => {
            window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedEmail}`, '_blank');
          }, 1000);
        } else {
          mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${selectedEmail}`;
        }
        break;
      case 'outlook':
        if (isMobile) {
          mailtoLink = `ms-outlook://compose?to=${selectedEmail}`;
          setTimeout(() => {
            window.open(
              `https://outlook.live.com/mail/0/deeplink/compose?to=${selectedEmail}`,
              '_blank'
            );
          }, 1000);
        } else {
          mailtoLink = `https://outlook.live.com/mail/0/deeplink/compose?to=${selectedEmail}`;
        }
        break;
      case 'yahoo':
        if (isMobile) {
          mailtoLink = `ymail://mail/compose?to=${selectedEmail}`;
          setTimeout(() => {
            window.open(`https://compose.mail.yahoo.com/?to=${selectedEmail}`, '_blank');
          }, 1000);
        } else {
          mailtoLink = `https://compose.mail.yahoo.com/?to=${selectedEmail}`;
        }
        break;
      default:
        mailtoLink = `mailto:${selectedEmail}`;
    }

    if (service === 'default') {
      window.location.href = mailtoLink;
    } else {
      window.open(mailtoLink, '_blank');
    }

    resetSelection();
  };

  useEffect(() => {
    if (!isSelectMode) {
      setSelectedUsers(new Set());
    }
  }, [isSelectMode]);

  if (!data || !data.node) {
    return <div>Error: Invalid data</div>;
  }

  return (
    <div className="сontentType_container">
      <div className="сontentType_inputContainer">
        <div className="сontentType_descriptionContainer">
          <input
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            className="сontentType_description"
            placeholder="Node description"
            ref={inputRef}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {!isFocused && (
            <button className="сontentType_editButton" onClick={() => inputRef.current?.focus()}>
              edit
            </button>
          )}
        </div>
      </div>
      {teamUsers.length === 0 && (
        <div className="сontentTypeC_emptyListHint">
          To see members, create a connection with a <b>Person</b> node.
        </div>
      )}
      <div className="сontentTypeC_usersTeamContainer">
        {teamUsers.length === 0 ? (
          <div className="сontentTypeC_usersList">
            {[1, 2, 3].map((_, idx) => (
              <div key={idx} className="сontentTypeC_userItem skeleton">
                <div className="сontentTypeC_userAvatar skeleton-avatar" />
                <div className="сontentTypeC_userName skeleton-line" />
                <div className="сontentTypeC_userRole skeleton-line" />
                <div className="сontentTypeC_userEmail skeleton-line" />
                <div className="сontentTypeC_actions">
                  <div className="сontentTypeC_moveButton skeleton-btn" />
                  <div className="сontentTypeC_moveButton skeleton-btn" />
                  <div className="сontentTypeC_dragHandle skeleton-btn" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="сontentTypeC_analytics">
              <div className="сontentTypeC_analyticsItem">
                <span className="сontentTypeC_analyticsLabel">Members:</span>
                <span className="сontentTypeC_analyticsValue">{teamUsers.length}</span>
              </div>
              <div className="сontentTypeC_analyticsActions">
                {isSelectMode && selectedUsers.size > 0 && (
                  <button
                    className="сontentTypeC_analyticsSendEmail"
                    onClick={handleGroupEmailSend}
                  >
                    Send email
                  </button>
                )}
                <button
                  className={`сontentTypeC_analyticsSelect ${isSelectMode ? 'active' : ''}`}
                  onClick={handleSelectModeToggle}
                >
                  {isSelectMode ? 'Cancel' : 'Select'}
                </button>
              </div>
            </div>
            <div className="сontentTypeC_searchContainer">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className="сontentTypeC_searchInput fs16"
                placeholder="Search by name, email or role..."
              />
              {searchQuery && (
                <button
                  className="сontentTypeC_searchReset"
                  onClick={handleSearchReset}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <div className="сontentTypeC_usersList">
              {filteredUsers.map((user, index) => (
                <div
                  key={user.id}
                  className={`сontentTypeC_userItem ${selectedUsers.has(user.id) ? 'selected' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(user)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(user)}
                  onClick={(e) =>
                    isSelectMode ? handleUserSelect(e, user.id) : handleUserClick(e, user.id)
                  }
                  style={{ cursor: isSelectMode ? 'pointer' : 'pointer' }}
                >
                  <div className="сontentTypeC_userAvatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="сontentTypeC_userName">{getUserNameById(user.id)}</div>
                  <div className="сontentTypeC_userRole">
                    <input
                      type="text"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      onFocus={() => handleRoleFocus(user.id)}
                      onBlur={handleRoleBlur}
                    />
                    {focusedRoleInput !== user.id && (
                      <button
                        className="сontentTypeC_roleEditButton"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.target.previousSibling.focus();
                        }}
                      >
                        edit
                      </button>
                    )}
                  </div>
                  <div
                    className="сontentTypeC_userEmail"
                    onClick={(e) => handleEmailClick(e, getUserEmailById(user.id))}
                  >
                    {getUserEmailById(user.id)}
                  </div>
                  <div className="сontentTypeC_actions">
                    <button
                      className="сontentTypeC_moveButton сontentTypeC_moveLeft"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(user.id);
                      }}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      className="сontentTypeC_moveButton сontentTypeC_moveRight"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(user.id);
                      }}
                      disabled={index === teamUsers.length - 1}
                    >
                      ↓
                    </button>
                    <div className="сontentTypeC_dragHandle">☰</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showEmailModal && (
        <div className="сontentTypeC_emailModal">
          <div className="сontentTypeC_emailModalContent">
            <h3>Choose email service</h3>
            <div className="сontentTypeC_emailServices">
              <button onClick={() => handleEmailServiceSelect('default')}>
                Default Mail Client
              </button>
              <button onClick={() => handleEmailServiceSelect('gmail')}>Gmail</button>
              <button onClick={() => handleEmailServiceSelect('outlook')}>Outlook</button>
              <button onClick={() => handleEmailServiceSelect('yahoo')}>Yahoo Mail</button>
            </div>
            <button className="сontentTypeC_emailModalClose" onClick={resetSelection}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentTypeC;

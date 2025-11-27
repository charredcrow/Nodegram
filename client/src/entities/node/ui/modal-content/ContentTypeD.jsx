import React, { useState, useRef } from 'react';

const ContentTypeD = ({ data, onUpdate, nodesData, links }) => {
  const [description, setDescription] = useState(data?.node?.description || '');
  const [isFocused, setIsFocused] = useState(false); // For managing focus on description input
  const inputRef = useRef(null); // Ссылка на input

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    if (data && data.node) {
      onUpdate({ ...data, node: { ...data.node, description: e.target.value } });
    }
  };

  // Функция для обновления простых разделов (People, Contacts, Documents, Education, Finance)
  const handleContentChange = (section, field, e) => {
    const value = e.target.value;
    const currentContent = data.node.content ? { ...data.node.content } : {};
    const sectionData = currentContent[section] ? { ...currentContent[section] } : {};
    sectionData[field] = value;
    currentContent[section] = sectionData;
    onUpdate({ ...data, node: { ...data.node, content: currentContent } });
  };

  // Определяем разделы для остальных данных с метками на английском
  const contentSections = {
    Person: [
      { field: 'first_name', label: 'First Name' },
      { field: 'last_name', label: 'Last Name' },
      { field: 'middle_name', label: 'Middle Name' },
      { field: 'date_of_birth', label: 'Date of Birth', type: 'date' },
      { field: 'gender', label: 'Gender' },
      { field: 'nationality', label: 'Nationality' },
      { field: 'citizenship', label: 'Citizenship' },
      { field: 'marital_status', label: 'Marital Status' },
    ],
    contacts: [
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'secondary_phone', label: 'Secondary Phone' },
      { field: 'address', label: 'Address' },
      { field: 'city', label: 'City' },
      { field: 'region', label: 'Region/State' },
      { field: 'country', label: 'Country' },
    ],
    documents: [
      { field: 'doc_type', label: 'Document Type' },
      { field: 'doc_number', label: 'Document Number' },
      { field: 'issue_date', label: 'Issue Date', type: 'date' },
      { field: 'expiry_date', label: 'Expiry Date', type: 'date' },
      { field: 'issued_by', label: 'Issued By' },
    ],
    education: [
      { field: 'institution', label: 'Institution' },
      { field: 'degree', label: 'Degree' },
      { field: 'field', label: 'Field of Study' },
      { field: 'start_year', label: 'Start Year', type: 'number' },
      { field: 'end_year', label: 'End Year', type: 'number' },
    ],
    finance: [
      { field: 'bank_name', label: 'Bank Name' },
      { field: 'account_number', label: 'Account Number' },
      { field: 'card_number', label: 'Card Number' },
      { field: 'balance', label: 'Balance', type: 'number' },
      { field: 'currency', label: 'Currency' },
    ],
    // socialMedia и notes будут обрабатываться отдельно
    socialMedia: [],
    notes: [],
  };

  /* ==========================
     SocialMedia – динамический список
     ========================== */
  const initialSocialMedia = data.node.content?.socialMedia || [''];
  const [socialMediaLinks, setSocialMediaLinks] = useState(initialSocialMedia);
  // Массив для отслеживания режима редактирования каждого поля (false – режим просмотра)
  const [socialMediaEditing, setSocialMediaEditing] = useState(initialSocialMedia.map(() => false));

  const updateSocialMedia = (newLinks) => {
    setSocialMediaLinks(newLinks);
    const currentContent = data.node.content ? { ...data.node.content } : {};
    currentContent.socialMedia = newLinks;
    onUpdate({ ...data, node: { ...data.node, content: currentContent } });
  };

  const handleSocialMediaChange = (index, e) => {
    const value = e.target.value;
    const newLinks = [...socialMediaLinks];
    newLinks[index] = value;
    updateSocialMedia(newLinks);
  };

  const handleSocialMediaToggleEdit = (index) => {
    const newEditing = [...socialMediaEditing];
    newEditing[index] = true;
    setSocialMediaEditing(newEditing);
  };

  // *** Добавлена функция handleSocialMediaAdd ***
  const handleSocialMediaAdd = () => {
    const newLinks = [...socialMediaLinks, ''];
    updateSocialMedia(newLinks);
    setSocialMediaEditing([...socialMediaEditing, false]);
  };

  const handleSocialMediaBlur = (index) => {
    // Если после редактирования пустых полей больше одного – удалить лишние
    const emptyCount = socialMediaLinks.filter((link) => link.trim() === '').length;
    if (emptyCount > 1) {
      const newLinks = [];
      let emptyFound = false;
      socialMediaLinks.forEach((link) => {
        if (link.trim() === '') {
          if (!emptyFound) {
            newLinks.push('');
            emptyFound = true;
          }
        } else {
          newLinks.push(link);
        }
      });
      updateSocialMedia(newLinks);
      setSocialMediaEditing(newLinks.map(() => false));
    }
    // Выключаем режим редактирования для данного поля
    const newEditing = [...socialMediaEditing];
    newEditing[index] = false;
    setSocialMediaEditing(newEditing);
  };

  /* ==========================
     Notes – динамический список
     ========================== */
  const initialNotes = data.node.content?.notes || [''];
  const [notes, setNotes] = useState(initialNotes);

  const updateNotes = (newNotes) => {
    setNotes(newNotes);
    const currentContent = data.node.content ? { ...data.node.content } : {};
    currentContent.notes = newNotes;
    onUpdate({ ...data, node: { ...data.node, content: currentContent } });
  };

  const handleNoteChange = (index, e) => {
    const value = e.target.value;
    const newNotes = [...notes];
    newNotes[index] = value;
    updateNotes(newNotes);
  };

  const handleNoteAdd = () => {
    const newNotes = [...notes, ''];
    updateNotes(newNotes);
  };

  const handleNoteBlur = (index) => {
    const emptyCount = notes.filter((note) => note.trim() === '').length;
    if (emptyCount > 1) {
      const newNotes = [];
      let emptyFound = false;
      notes.forEach((note) => {
        if (note.trim() === '') {
          if (!emptyFound) {
            newNotes.push('');
            emptyFound = true;
          }
        } else {
          newNotes.push(note);
        }
      });
      updateNotes(newNotes);
    }
  };

  if (!data || !data.node) {
    return <div>Error: Invalid data</div>;
  }

  /* ======= Новая функциональность: вывод текущих ивентов ======= */
  // Получаем ID текущего узла
  const currentNodeId = data.node.id;
  // Находим все target, где source === currentNodeId
  const connectedTargets = links
    .filter((link) => link.source === currentNodeId || link.target === currentNodeId)
    .map((link) => (link.source === currentNodeId ? link.target : link.source));

  // Находим все узлы с type === "typeB" из nodesData, которые соединены с текущим узлом
  const connectedNodes = nodesData.filter(
    (node) => connectedTargets.includes(node.id) && node.type === 'typeB'
  );
  // Если нет соединенных узлов, оставляем список событий пустым
  const currentEvents =
    connectedNodes.length > 0
      ? connectedNodes.filter((node) => {
          if (!node.content) return false;

          const startDate = node.content.event_startTime
            ? new Date(Number(node.content.event_startTime))
            : null;
          const endDate = node.content.event_endTime
            ? new Date(Number(node.content.event_endTime))
            : null;
          const now = new Date();

          return (
            (startDate && !isNaN(startDate) && startDate > now) || // Если startDate в будущем
            (endDate && !isNaN(endDate) && endDate > now) // Или если endDate в будущем
          );
        })
      : [];

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
        <div className="сontentTypeD_personContainer">
          {currentEvents && currentEvents.length > 0 ? (
            <div className="сontentTypeD_personEvents">
              <h3 className="сontentTypeD_eventsTitle">Upcoming Events</h3>
              {currentEvents.map((event, index) => (
                <div key={index} className="сontentTypeD_eventItem">
                  <span className="сontentTypeD_eventName">{event.title}</span>
                  <span className="сontentTypeD_eventStart">
                    {event.content && event.content.event_startTime
                      ? new Date(Number(event.content.event_startTime)).toLocaleString()
                      : 'Invalid Date'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div></div>
          )}

          {Object.keys(contentSections).map((sectionKey) => {
            if (sectionKey === 'socialMedia') {
              return (
                <div key="socialMedia" className="contentTypeD_socialMediaSection">
                  <h3 className="contentTypeD_socialMediaTitle">
                    Social Media{' '}
                    <button
                      className="contentTypeD_addButton"
                      onClick={handleSocialMediaAdd}
                      type="button"
                    >
                      Add link
                    </button>
                  </h3>
                  {socialMediaLinks.map((link, index) => (
                    <div key={index} className="contentTypeD_fieldContainer">
                      {/* <label
                        className="contentTypeD_label"
                        htmlFor={`socialMedia_${index}`}
                      >
                        Link
                      </label> */}
                      {socialMediaEditing[index] ? (
                        <input
                          type="text"
                          id={`socialMedia_${index}`}
                          value={link}
                          onChange={(e) => handleSocialMediaChange(index, e)}
                          onBlur={() => handleSocialMediaBlur(index)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.target.blur();
                            }
                          }}
                          className="contentTypeD_input"
                          placeholder="Enter URL"
                        />
                      ) : (
                        <div className="contentTypeD_socialMediaDisplay">
                          {link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="contentTypeD_link"
                            >
                              {link.length > 35 ? `${link.substring(0, 35)}...` : link}
                            </a>
                          ) : (
                            <span className="contentTypeD_placeholder">Enter URL</span>
                          )}
                          <button
                            className="contentTypeD_editIcon"
                            onClick={() => handleSocialMediaToggleEdit(index)}
                            type="button"
                          >
                            &#9998;
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            } else if (sectionKey === 'notes') {
              return (
                <div key="notes" className="contentTypeD_notesSection">
                  <h3 className="contentTypeD_notesTitle">
                    Notes{' '}
                    <button
                      className="contentTypeD_addButton"
                      onClick={handleNoteAdd}
                      type="button"
                    >
                      Add note
                    </button>
                  </h3>
                  {notes.map((note, index) => (
                    <div key={index} className="contentTypeD_fieldContainer">
                      <label className="contentTypeD_label" htmlFor={`notes_${index}`}>
                        Note
                      </label>
                      <textarea
                        type="text"
                        id={`notes_${index}`}
                        value={note}
                        onChange={(e) => handleNoteChange(index, e)}
                        onBlur={() => handleNoteBlur(index)}
                        className="contentTypeD_textarea"
                        placeholder="Enter note"
                        rows={8}
                      />
                    </div>
                  ))}
                </div>
              );
            } else {
              return (
                <div key={sectionKey} className={`contentTypeD_${sectionKey}Section`}>
                  <h3 className={`contentTypeD_${sectionKey}Title`}>
                    {sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}
                  </h3>
                  {contentSections[sectionKey].map(({ field, label, type }) => {
                    const sectionData = (data.node.content && data.node.content[sectionKey]) || {};
                    return (
                      <div key={field} className="contentTypeD_fieldContainer">
                        {/* <label
                          className="contentTypeD_label"
                          htmlFor={`${sectionKey}_${field}`}
                        >
                          {label}
                        </label> */}
                        {type === 'date' ? (
                          <div
                            className="contentTypeD_dateInputWrapper"
                            onClick={(e) => {
                              const input = e.currentTarget.querySelector('input[type="date"]');
                              if (input) {
                                input.showPicker();
                              }
                            }}
                          >
                            <input
                              type="date"
                              id={`${sectionKey}_${field}_native`}
                              value={sectionData[field] || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                handleContentChange(sectionKey, field, { target: { value } });
                              }}
                              style={{
                                position: 'absolute',
                                opacity: 0,
                                width: '100%',
                                height: '100%',
                                cursor: 'pointer',
                              }}
                            />
                            <input
                              type="text"
                              id={`${sectionKey}_${field}`}
                              value={sectionData[field] || ''}
                              onChange={(e) => handleContentChange(sectionKey, field, e)}
                              className="contentTypeD_input"
                              placeholder={label}
                              readOnly
                            />
                          </div>
                        ) : (
                          <input
                            type={type || 'text'}
                            id={`${sectionKey}_${field}`}
                            value={sectionData[field] || ''}
                            onChange={(e) => handleContentChange(sectionKey, field, e)}
                            className="contentTypeD_input"
                            placeholder={label}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
};

export default ContentTypeD;

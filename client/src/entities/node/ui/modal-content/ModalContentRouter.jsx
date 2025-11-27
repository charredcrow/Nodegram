import React from 'react';
import ContentTypeA from './ContentTypeA';
import ContentTypeB from './ContentTypeB';
import ContentTypeС from './ContentTypeС';
import ContentTypeD from './ContentTypeD';
import ContentTypeE from './ContentTypeE';
import ContentTypeF from './ContentTypeF';
import ContentTypeG from './ContentTypeG';
import ContentTypeH from './ContentTypeH';
import ContentTypeI from './ContentTypeI';
import ContentTypeK from './ContentTypeK';
import ContentTypeL from './ContentTypeL';
import ContentTypeM from './ContentTypeM';
import ContentTypeN from './ContentTypeN';
import ContentTypeO from './ContentTypeO';
import ContentTypeP from './ContentTypeP';
const DefaultContent = () => <div>Default Content</div>;

const ModalContentRouter = ({
  type,
  data,
  nodesData,
  links,
  onUpdate,
  currentWid,
  openNodeModal,
  widModeShared,
}) => {
  const handleUpdate = (updatedData) => {
    if (onUpdate) {
      onUpdate(updatedData); // Передаем обновленные данные дальше наверх
    }
  };

  let content;

  switch (type) {
    // Node
    case 'typeA':
      content = <ContentTypeA data={data} onUpdate={handleUpdate} />;
      break;
    // Event
    case 'typeB':
      content = <ContentTypeB data={data} onUpdate={handleUpdate} />;
      break;
    // Team
    case 'typeC':
      content = (
        <ContentTypeС
          data={data}
          onUpdate={handleUpdate}
          nodesData={nodesData}
          links={links}
          openNodeModal={openNodeModal}
        />
      );
      break;
    // Person
    case 'typeD':
      content = (
        <ContentTypeD data={data} onUpdate={handleUpdate} nodesData={nodesData} links={links} />
      );
      break;
    // Items
    case 'typeE':
      content = (
        <ContentTypeE data={data} onUpdate={handleUpdate} nodesData={nodesData} links={links} />
      );
      break;
    // Orders
    case 'typeF':
      content = (
        <ContentTypeF data={data} onUpdate={handleUpdate} nodesData={nodesData} links={links} />
      );
      break;
    // Finance
    case 'typeG':
      content = (
        <ContentTypeG
          data={data}
          onUpdate={handleUpdate}
          nodesData={nodesData}
          links={links}
          currentWid={currentWid}
          widModeShared={widModeShared}
        />
      );
      break;
    // Branch
    case 'typeH':
      content = (
        <ContentTypeH data={data} onUpdate={handleUpdate} nodesData={nodesData} links={links} />
      );
      break;
    // Document
    case 'typeI':
      content = (
        <ContentTypeI
          data={data}
          onUpdate={handleUpdate}
          nodesData={nodesData}
          currentWid={currentWid}
          widModeShared={widModeShared}
        />
      );
      break;
    // Timeline
    case 'typeK':
      content = <ContentTypeK data={data} onUpdate={handleUpdate} nodesData={nodesData} />;
      break;
    // Synapse
    case 'typeL':
      content = <ContentTypeL data={data} onUpdate={handleUpdate} nodesData={nodesData} />;
      break;
    // Documentation
    case 'typeM':
      content = <ContentTypeM data={data} onUpdate={handleUpdate} nodesData={nodesData} />;
      break;
    // Tasks
    case 'typeN':
      content = <ContentTypeN data={data} onUpdate={handleUpdate} nodesData={nodesData} />;
      break;
    // Chronology
    case 'typeO':
      content = <ContentTypeO data={data} onUpdate={handleUpdate} nodesData={nodesData} />;
      break;
    // Big Image
    case 'typeP':
      content = (
        <ContentTypeP
          data={data}
          onUpdate={handleUpdate}
          nodesData={nodesData}
          currentWid={currentWid}
          widModeShared={widModeShared}
        />
      );
      break;
    default:
      content = <DefaultContent data={data} />;
      break;
  }

  return content;
};

export default ModalContentRouter;

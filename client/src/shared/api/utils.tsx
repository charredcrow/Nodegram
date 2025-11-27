import {
  BsFileImage,
  BsFilePlay,
  BsFileMusic,
  BsFilePdf,
  BsFileWord,
  BsFileExcel,
  BsFileZip,
  BsFileEarmark,
} from 'react-icons/bs';
import type { ReactElement } from 'react';

// Function to get icon based on file type
export const getFileIcon = (fileType: string): ReactElement => {
  const iconStyle = { width: '16px', height: '16px' };

  if (fileType.startsWith('image/')) return <BsFileImage style={iconStyle} />;
  if (fileType.startsWith('video/')) return <BsFilePlay style={iconStyle} />;
  if (fileType.startsWith('audio/')) return <BsFileMusic style={iconStyle} />;
  if (fileType.includes('pdf')) return <BsFilePdf style={iconStyle} />;
  if (fileType.includes('word')) return <BsFileWord style={iconStyle} />;
  if (fileType.includes('excel')) return <BsFileExcel style={iconStyle} />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z'))
    return <BsFileZip style={iconStyle} />;
  return <BsFileEarmark style={iconStyle} />;
};

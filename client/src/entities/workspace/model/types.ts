// Workspace types
export const generateWid = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let wid = '';
  for (let i = 0; i < 16; i++) {
    wid += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return wid;
};

export const generateNodeId = (): number => {
  return Date.now() + Math.random();
};

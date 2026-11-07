const sectionByType = {
  website: 'reading',
  text: 'reading',
  story: 'reading',
  audio: 'listening',
  image: 'album',
  video: 'video',
  game: 'game',
};

export function getSectionForType(type) {
  const value = String(type || '').trim().toLowerCase();
  return sectionByType[value] || 'reading';
}

export function getVisibleContentItems(section, items = [], options = {}) {
  const { isAdmin = false } = options;
  const collection = Array.isArray(items) ? items : [];
  const filtered = collection.filter((item) => {
    if (isAdmin) return true;
    return item?.visible !== false;
  });

  if (!section) return filtered;

  return filtered.filter((item) => getSectionForType(item?.type) === section);
}

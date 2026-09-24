/**
 * Utilidades do perfil do usuário (apelido, banner e imagens)
 */

/** Banners prontos (gradientes) que o usuário pode escolher sem enviar imagem */
export const BANNER_PRESETS = {
  bitcoin: { label: 'Bitcoin', css: 'linear-gradient(135deg, #f7931a 0%, #ffb84d 45%, #1a1204 100%)' },
  sunset: { label: 'Pôr do sol', css: 'linear-gradient(135deg, #ff5f6d 0%, #ffc371 100%)' },
  ocean: { label: 'Oceano', css: 'linear-gradient(135deg, #0f2027 0%, #2c5364 50%, #00b4db 100%)' },
  aurora: { label: 'Aurora', css: 'linear-gradient(135deg, #00c9a7 0%, #845ec2 100%)' },
  night: { label: 'Noite', css: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)' },
  candy: { label: 'Neon', css: 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)' }
};

export const DEFAULT_BANNER = 'preset:bitcoin';

/**
 * Estilo CSS do banner (imagem enviada ou gradiente pronto)
 */
export const bannerStyle = (banner) => {
  const value = banner || DEFAULT_BANNER;
  if (value.startsWith('preset:')) {
    return { background: (BANNER_PRESETS[value.slice(7)] || BANNER_PRESETS.bitcoin).css };
  }
  return { backgroundImage: `url("${value}")`, backgroundSize: 'cover', backgroundPosition: 'center' };
};

/**
 * Nome exibido no site: "como quer ser chamado" ou o primeiro nome
 */
export const displayNameOf = (user) => user?.displayName || user?.name?.split(' ')[0] || '';

export const initialsOf = (user) =>
  (user?.displayName || user?.name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem.'));
    };
    img.src = url;
  });

/**
 * Recorta a imagem no formato desejado (preenchendo o espaço, como "cover")
 * e comprime em JPEG. Mantém o envio leve: foto ~20 KB, banner ~150 KB.
 * @param {File} file - Arquivo escolhido pelo usuário
 * @param {{ width: number, height: number, quality?: number }} size
 * @returns {Promise<string>} data URL da imagem
 */
export const resizeImage = async (file, { width, height, quality = 0.85 }) => {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Use uma imagem PNG, JPG, WEBP ou GIF.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Imagem muito grande (máximo de 10 MB).');
  }

  const img = await loadImage(file);
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  const drawWidth = img.naturalWidth * scale;
  const drawHeight = img.naturalHeight * scale;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#121722';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);

  return canvas.toDataURL('image/jpeg', quality);
};

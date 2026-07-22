// Filtros de digitação usados nos formulários: cada campo só aceita o
// tipo de caractere condizente com o que ele representa.

export function onlyLetters(value) {
  return value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'-]/g, '');
}

export function onlyDigits(value) {
  return value.replace(/\D/g, '');
}

export function phoneChars(value) {
  return value.replace(/[^\d\s()+-]/g, '');
}

export function ipAddressChars(value) {
  return value.replace(/[^\d.]/g, '');
}

export function macAddressChars(value) {
  return value.replace(/[^0-9A-Fa-f:-]/g, '');
}

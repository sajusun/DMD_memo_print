/**
 * Dinajpur Metallic Designs (DMD) - Bengali Number & Currency Utilities
 */

const englishDigits = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

const banglaDigits = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
};

/**
 * Convert Bengali digits (০-৯) to English number string/number
 * @param {string|number} data 
 * @returns {number}
 */
function bn2en(data) {
  if (data === null || data === undefined || data === '') return 0;
  const str = data.toString().trim();
  const converted = str.replace(/[০১২৩৪৫৬৭৮৯]/g, s => englishDigits[s]);
  const parsed = parseFloat(converted.replace(/,/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Convert English number or string to Bengali digits (০-৯)
 * @param {string|number} data 
 * @returns {string}
 */
function en2bn(data) {
  if (data === null || data === undefined || data === '') return '০';
  const str = data.toString();
  return str.replace(/[0-9]/g, s => banglaDigits[s]);
}

/**
 * Format currency with commas and currency symbol in Bengali
 * e.g. 15000 -> ১৫,০০০/-
 * @param {number|string} amount 
 * @param {boolean} withSign 
 * @returns {string}
 */
function formatCurrencyBn(amount, withSign = true) {
  const num = bn2en(amount);
  const parts = num.toFixed(2).split('.');
  const intPart = parts[0];
  const decPart = parts[1];

  // Indian/Bengali numbering system format (last 3, then groups of 2)
  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  
  let formatted = en2bn(formattedInt);
  if (parseInt(decPart, 10) > 0) {
    formatted += '.' + en2bn(decPart);
  }
  
  return withSign ? `${formatted}/-` : formatted;
}

// Bengali words map
const first = [
  "", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়",
  "দশ", "এগার", "বার", "তের", "চৌদ্দ", "পনের", "ষোল", "সতের", "আঠার", "উনিশ",
  "বিশ", "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আঠাশ", "ঊনত্রিশ",
  "ত্রিশ", "একত্রিশ", "বত্রিশ", "তেত্রিশ", "চৌত্রিশ", "পঁয়ত্রিশ", "ছত্রিশ", "সাঁয়ত্রিশ", "আটত্রিশ", "ঊনচল্লিশ",
  "চল্লিশ", "একচল্লিশ", "বিয়াল্লিশ", "তেতাল্লিশ", "চুয়াল্লিশ", "পঁয়তাল্লিশ", "ছয়চল্লিশ", "সাতচল্লিশ", "আটচল্লিশ", "ঊনপঞ্চাশ",
  "পঞ্চাশ", "একান্ন", "বায়ান্ন", "তিপ্পান্ন", "চুয়ান্ন", "পঞ্চান্ন", "ছাপ্পান্ন", "সাতান্ন", "আটান্ন", "ঊনষাট",
  "ষাট", "একষট্টি", "বাষট্টি", "তেষট্টি", "চৌষট্টি", "পঁয়ষট্টি", "ছয়ষট্টি", "সাতষট্টি", "আটষট্টি", "ঊনসত্তর",
  "সত্তর", "একাত্তর", "বাহাত্তর", "তিয়াত্তর", "চুয়াত্তর", "পঁচাত্তর", "ছিয়াত্তর", "সাতাত্তর", "আটাত্তর", "ঊনআশি",
  "আশি", "একাশি", "বিরাশি", "তিরাশি", "চুরাশি", "পঁচাশি", "ছিয়াশি", "সাতাশি", "আটাশি", "ঊননব্বই",
  "নব্বই", "একানব্বই", "বিরানব্বই", "তিরানব্বই", "চুরানব্বই", "পঁচানব্বই", "ছিয়ানব্বই", "সাতানব্বই", "আটানব্বই", "নিরানব্বই"
];

const firstDes = [
  "শূণ্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়",
  "দশ", "এগার", "বার", "তের", "চৌদ্দ", "পনের", "ষোল", "সতের", "আঠার", "উনিশ",
  "বিশ", "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আঠাশ", "ঊনত্রিশ",
  "ত্রিশ", "একত্রিশ", "বত্রিশ", "তেত্রিশ", "চৌত্রিশ", "পঁয়ত্রিশ", "ছত্রিশ", "সাঁয়ত্রিশ", "আটত্রিশ", "ঊনচল্লিশ",
  "চল্লিশ", "একচল্লিশ", "বিয়াল্লিশ", "তেতাল্লিশ", "চুয়াল্লিশ", "পঁয়তাল্লিশ", "ছয়চল্লিশ", "সাতচল্লিশ", "আটচল্লিশ", "ঊনপঞ্চাশ",
  "পঞ্চাশ", "একান্ন", "বায়ান্ন", "তিপ্পান্ন", "চুয়ান্ন", "পঞ্চান্ন", "ছাপ্পান্ন", "সাতান্ন", "আটান্ন", "ঊনষাট",
  "ষাট", "একষট্টি", "বাষট্টি", "তেষট্টি", "চৌষট্টি", "পঁয়ষট্টি", "ছয়ষট্টি", "সাতষট্টি", "আটষট্টি", "ঊনসত্তর",
  "সত্তর", "একাত্তর", "বাহাত্তর", "তিয়াত্তর", "চুয়াত্তর", "পঁচাত্তর", "ছিয়াত্তর", "সাতাত্তর", "আটাত্তর", "ঊনআশি",
  "আশি", "একাশি", "বিরাশি", "তিরাশি", "চুরাশি", "পঁচাশি", "ছিয়াশি", "সাতাশি", "আটাশি", "ঊননব্বই",
  "নব্বই", "একানব্বই", "বিরানব্বই", "তিরানব্বই", "চুরানব্বই", "পঁচানব্বই", "ছিয়ানব্বই", "সাতানব্বই", "আটানব্বই", "নিরানব্বই"
];

const units = ["শত", "হাজার", "লক্ষ", "কোটি"];

function dec(ddd) {
  if (!ddd) return "";
  if (ddd.length > 1) {
    const d0 = parseInt(ddd[0], 10);
    const d1 = parseInt(ddd[1], 10);
    return " দশমিক " + (firstDes[d0] || "") + " " + (firstDes[d1] || "");
  } else if (ddd.length === 1) {
    const d0 = parseInt(ddd[0], 10);
    return " দশমিক " + (firstDes[d0] || "");
  }
  return "";
}

function first2degred(numStr) {
  const n = parseInt(numStr, 10);
  return first[n] || "";
}

function first2deg(numStr, desplace) {
  const n = parseInt(numStr, 10);
  const word = first[n];
  if (word) {
    return word + dec(desplace);
  }
  return "" + dec(desplace);
}

function hundred(numStr) {
  if (numStr.length === 3) {
    const subnum = numStr[1] + numStr[2];
    const hDigit = parseInt(numStr[0], 10);
    const unitWord = hDigit > 0 ? units[0] : "";
    const hWord = hDigit > 0 ? first[hDigit] : "";
    const rem = first2deg(subnum, "");
    return `${hWord} ${unitWord} ${rem}`.trim();
  }
  return "";
}

function thousand(numStr) {
  if (numStr.length === 4) {
    const subnum = numStr.substring(1);
    const tDigit = parseInt(numStr[0], 10);
    const tWord = tDigit > 0 ? first[tDigit] + " " + units[1] : "";
    return `${tWord} ${hundred(subnum)}`.trim();
  } else if (numStr.length === 5) {
    const subnum = numStr.substring(2);
    const tTwo = numStr.substring(0, 2);
    const tVal = parseInt(tTwo, 10);
    const tWord = tVal > 0 ? first2degred(tTwo) + " " + units[1] : "";
    return `${tWord} ${hundred(subnum)}`.trim();
  }
  return "";
}

function lakh(numStr) {
  if (numStr.length === 6) {
    const subnum = numStr.substring(1);
    const lDigit = parseInt(numStr[0], 10);
    const lWord = lDigit > 0 ? first[lDigit] + " " + units[2] : "";
    return `${lWord} ${thousand(subnum)}`.trim();
  } else if (numStr.length === 7) {
    const subnum = numStr.substring(2);
    const lTwo = numStr.substring(0, 2);
    const lVal = parseInt(lTwo, 10);
    const lWord = lVal > 0 ? first2degred(lTwo) + " " + units[2] : "";
    return `${lWord} ${thousand(subnum)}`.trim();
  }
  return "";
}

function crore(numStr) {
  if (numStr.length === 8) {
    const subnum = numStr.substring(1);
    const cDigit = parseInt(numStr[0], 10);
    const cWord = cDigit > 0 ? first[cDigit] + " " + units[3] : "";
    return `${cWord} ${lakh(subnum)}`.trim();
  } else if (numStr.length >= 9) {
    const cPart = numStr.substring(0, numStr.length - 7);
    const subnum = numStr.substring(numStr.length - 7);
    const cVal = parseInt(cPart, 10);
    const cWord = cVal > 0 ? inWordbn(cVal) + " " + units[3] : "";
    return `${cWord} ${lakh(subnum)}`.trim();
  }
  return "";
}

/**
 * Convert number to Bengali words
 * e.g. 15450 -> পনের হাজার চারশত পঞ্চাশ টাকা মাত্র
 * @param {number|string} nn 
 * @returns {string}
 */
function inWordbn(nn) {
  const num = bn2en(nn);
  if (!num || num === 0) return "শূণ্য টাকা মাত্র";

  const fullnumber = num.toString();
  const spl = fullnumber.split(".");
  const number = spl[0];
  const desplace = spl[1];

  let result = "";
  if (number.length < 3) {
    result = first2deg(number, desplace);
  } else if (number.length < 4) {
    result = hundred(number);
  } else if (number.length < 6) {
    result = thousand(number);
  } else if (number.length < 8) {
    result = lakh(number);
  } else {
    result = crore(number);
  }

  result = result.replace(/\s+/g, ' ').trim();
  return result ? `${result} টাকা মাত্র` : "";
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    bn2en,
    en2bn,
    formatCurrencyBn,
    inWordbn
  };
}

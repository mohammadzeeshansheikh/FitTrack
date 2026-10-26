/**
 * Format a number into Indian Rupee currency format (e.g., ₹1,25,000)
 */
export const formatINR = (amount) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return "₹0";
  }
  const numericVal = Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericVal);
};

/**
 * Validate a 10-digit Indian phone number (starting with 6, 7, 8, or 9)
 * Accepts formats like: "+91 98765 43210", "9876543210", "+919876543210"
 */
export const isValidIndianPhone = (phone) => {
  if (!phone) return false;
  const digitsOnly = phone.replace(/\D/g, "");
  // If starts with country code 91 and has 12 digits total
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    const subscriber = digitsOnly.slice(2);
    return /^[6-9]\d{9}$/.test(subscriber);
  }
  // Standard 10 digit number
  return /^[6-9]\d{9}$/.test(digitsOnly);
};

/**
 * Format a phone number into "+91 XXXXX XXXXX"
 */
export const formatIndianPhone = (phone) => {
  if (!phone) return "";
  const digitsOnly = phone.replace(/\D/g, "");
  let subscriber = digitsOnly;
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    subscriber = digitsOnly.slice(2);
  }
  if (subscriber.length === 10) {
    return `+91 ${subscriber.slice(0, 5)} ${subscriber.slice(5)}`;
  }
  return phone;
};

/**
 * Parse date to DD/MM/YYYY format string
 */
export const formatDateDDMMYYYY = (dateInput) => {
  if (!dateInput) return "";
  if (
    typeof dateInput === "string" &&
    /^\d{2}\/\d{2}\/\d{4}$/.test(dateInput)
  ) {
    return dateInput;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Parse DD/MM/YYYY string to Date object for comparison
 */
export const parseDDMMYYYYDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === "string" && dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      return new Date(year, month - 1, day);
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD for HTML5 date input calendar picker
 */
export const toISODateString = (dateStr) => {
  if (!dateStr) {
    // Return empty string so the calendar picker opens without locking to today
    return "";
  }
  if (typeof dateStr === "string" && dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }
  if (typeof dateStr === "string" && dateStr.includes("-")) {
    return dateStr;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Convert YYYY-MM-DD from calendar picker to DD/MM/YYYY
 */
export const fromISODateString = (isoStr) => {
  if (!isoStr) return "";
  if (typeof isoStr === "string" && isoStr.includes("-")) {
    const [year, month, day] = isoStr.split("-");
    return `${day}/${month}/${year}`;
  }
  return isoStr;
};

/**
 * Calculate membership expiry date based on start date and plan duration
 * E.g., calculateExpiryDate("15/01/2026", "3 Months") -> "15/04/2026"
 */
export const calculateExpiryDate = (startDateStr, durationStr) => {
  const startDate = parseDDMMYYYYDate(startDateStr) || new Date();
  const d = new Date(startDate.getTime());

  let monthsToAdd = 1;
  if (durationStr) {
    const matchedNum = durationStr.match(/\d+/);
    if (matchedNum) {
      monthsToAdd = parseInt(matchedNum[0], 10);
    }
  }

  d.setMonth(d.getMonth() + monthsToAdd);
  return formatDateDDMMYYYY(d);
};

/**
 * Compress and downscale uploaded image file to lightweight base64 string (~3-5 KB)
 * prevents inflating db.json with megabytes of raw image data.
 */
export const compressImage = (
  file,
  maxWidth = 120,
  maxHeight = 120,
  quality = 0.7,
) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight JPEG data URL (~3 KB)
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

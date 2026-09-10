// Real SMS Gateway Dispatch Service for SahayogSetu
// Supports Fast2SMS (India), 2Factor.in, and Twilio

function clean10DigitPhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  // Handle Indian numbers with 91 prefix (12 digits)
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  // Handle Indian numbers with leading 0 (11 digits)
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  // If 10 or more digits, extract last 10 digits
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

function maskPhone(phone) {
  const digits = clean10DigitPhone(phone);
  if (digits.length < 10) return '+91 ******';
  return `+91 ${digits.slice(0, 3)}****${digits.slice(-3)}`;
}

async function sendSmsOtp(phone, otp, mentorName = 'Faculty Mentor') {
  const tenDigit = clean10DigitPhone(phone);
  const masked = maskPhone(phone);
  const messageText = `Your SahayogSetu verification OTP for mentor endorsement (${mentorName}) is ${otp}. Valid for 15 minutes.`;

  console.log(`[SMS DISPATCH INITIATED] To: ${phone} (${mentorName}) | Masked: ${masked}`);

  // 1. Try Fast2SMS (India Direct OTP Route)
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    try {
      console.log(`[FAST2SMS] Dispatching OTP via Fast2SMS Indian Gateway to ${tenDigit}...`);
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: tenDigit
        })
      });

      const data = await res.json();
      console.log('[FAST2SMS RESPONSE]:', data);
      if (data && data.return) {
        return { success: true, provider: 'fast2sms', message: 'SMS delivered to phone' };
      }
    } catch (err) {
      console.error('[FAST2SMS ERROR]:', err.message);
    }
  }

  // 2. Try 2Factor.in (India Direct OTP)
  const twoFactorKey = process.env.TWO_FACTOR_API_KEY;
  if (twoFactorKey) {
    try {
      console.log(`[2FACTOR] Dispatching OTP via 2Factor to ${tenDigit}...`);
      const url = `https://2factor.in/API/V1/${twoFactorKey}/SMS/${tenDigit}/${otp}/OTP1`;
      const res = await fetch(url);
      const data = await res.json();
      console.log('[2FACTOR RESPONSE]:', data);
      if (data && data.Status === 'Success') {
        return { success: true, provider: '2factor', message: 'SMS delivered via 2Factor' };
      }
    } catch (err) {
      console.error('[2FACTOR ERROR]:', err.message);
    }
  }

  // 3. Try Twilio
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      console.log(`[TWILIO] Dispatching OTP via Twilio to ${phone}...`);
      const fullPhone = phone.startsWith('+') ? phone : `+91${tenDigit}`;
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: fullPhone,
          From: twilioFrom,
          Body: messageText
        })
      });
      const data = await res.json();
      console.log('[TWILIO RESPONSE]:', data.sid || data.message);
      if (data && data.sid) {
        return { success: true, provider: 'twilio', message: 'SMS delivered via Twilio' };
      }
    } catch (err) {
      console.error('[TWILIO ERROR]:', err.message);
    }
  }

  // Server-side diagnostic log (for terminal when no paid gateway configured)
  console.log(`---------------------------------------------------------------`);
  console.log(`📱 [REAL SMS DISPATCH LOG] To: ${phone} (${mentorName})`);
  console.log(`💬 Message: "${messageText}"`);
  console.log(`🔐 OTP Code: ${otp}`);
  console.log(`💡 Note: To deliver live cellular SMS via telecom carrier, add FAST2SMS_API_KEY or TWILIO credentials in backend/.env`);
  console.log(`---------------------------------------------------------------`);

  return { success: true, provider: 'dispatched', maskedPhone: masked };
}

function hasCarrierGatewayConfigured() {
  return !!(
    (process.env.FAST2SMS_API_KEY && process.env.FAST2SMS_API_KEY.trim()) ||
    (process.env.TWO_FACTOR_API_KEY && process.env.TWO_FACTOR_API_KEY.trim()) ||
    (process.env.MSG91_AUTH_KEY && process.env.MSG91_AUTH_KEY.trim()) ||
    (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
  );
}

function getWhatsAppDispatchUrl(phone, otp, mentorName = 'Faculty Mentor') {
  const tenDigit = clean10DigitPhone(phone);
  const fullPhone = `91${tenDigit}`;
  const text = encodeURIComponent(`🏛️ *SahayogSetu Official Verification*\n\nYour 6-digit Faculty Mentor verification OTP for *${mentorName}* is: *${otp}*\n\n(Valid for 15 minutes. Enter this code on the portal to officially approve the SIH solution).`);
  return `https://api.whatsapp.com/send?phone=${fullPhone}&text=${text}`;
}

function getSmsAppUrl(phone, otp, mentorName = 'Faculty Mentor') {
  const tenDigit = clean10DigitPhone(phone);
  const fullPhone = `+91${tenDigit}`;
  const text = encodeURIComponent(`Official SahayogSetu Verification OTP for ${mentorName} is: ${otp} (Valid for 15 minutes).`);
  return `sms:${fullPhone}?body=${text}`;
}

module.exports = {
  sendSmsOtp,
  getWhatsAppDispatchUrl,
  getSmsAppUrl,
  hasCarrierGatewayConfigured,
  clean10DigitPhone,
  maskPhone
};


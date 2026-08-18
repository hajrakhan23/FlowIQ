import emailjs from 'emailjs-com';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_4o4xxwj';
const TEMPLATE_TOKEN_CONFIRM = import.meta.env.VITE_EMAILJS_TEMPLATE_TOKEN_CONFIRM || 'template_otj3k8g';
const TEMPLATE_WELCOME = import.meta.env.VITE_EMAILJS_TEMPLATE_WELCOME || 'template_2qwygbz';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'HBFBDXmWsbhV9l6nL';

// Initialize emailjs if public key is available
if (PUBLIC_KEY && PUBLIC_KEY !== 'your_emailjs_public_key') {
  try {
    emailjs.init(PUBLIC_KEY);
  } catch (err) {
    console.warn('EmailJS initialization note:', err);
  }
}

export interface TokenConfirmationEmailParams {
  to_email: string;
  patient_name: string;
  token_number: number | string;
  department: string;
  counter_name: string;
  wait_time: number | string;
  joined_at: string;
}

export interface WelcomeEmailParams {
  to_email: string;
  patient_name: string;
  email: string;
  role: string;
}

export const emailService = {
  /**
   * Send Token Confirmation Email via EmailJS
   */
  async sendTokenConfirmation(params: TokenConfirmationEmailParams): Promise<{ success: boolean; message: string }> {
    if (!params.to_email) {
      return { success: false, message: 'No registered email found.' };
    }

    const templateParams = {
      to_email: params.to_email,
      patient_name: params.patient_name || 'Valued Patient',
      token_number: params.token_number,
      department: params.department,
      counter_name: params.counter_name,
      wait_time: `${params.wait_time} mins`,
      joined_at: params.joined_at || new Date().toLocaleString(),
    };

    console.log('[EmailJS] Dispatching token confirmation email to:', params.to_email, templateParams);

    try {
      if (PUBLIC_KEY && PUBLIC_KEY !== 'your_emailjs_public_key') {
        const res = await emailjs.send(SERVICE_ID, TEMPLATE_TOKEN_CONFIRM, templateParams, PUBLIC_KEY);
        console.log('[EmailJS] Token email sent successfully:', res.status, res.text);
        return { success: true, message: 'Confirmation email sent to ' + params.to_email };
      } else {
        console.log('[EmailJS Simulation] Email confirmation sent to:', params.to_email);
        return { success: true, message: `Simulated: Confirmation email sent to ${params.to_email}` };
      }
    } catch (error: any) {
      console.warn('[EmailJS] Failed to send token confirmation email:', error?.text || error?.message || error);
      return { success: false, message: error?.text || 'Could not deliver email' };
    }
  },

  /**
   * Send Welcome Email on new registration and role selection
   */
  async sendWelcomeEmail(params: WelcomeEmailParams): Promise<{ success: boolean; message: string }> {
    if (!params.to_email) {
      return { success: false, message: 'No registered email provided.' };
    }

    const templateParams = {
      to_email: params.to_email,
      patient_name: params.patient_name || 'User',
      email: params.email || params.to_email,
      role: params.role.toUpperCase(),
    };

    console.log('[EmailJS] Dispatching welcome email to:', params.to_email, templateParams);

    try {
      if (PUBLIC_KEY && PUBLIC_KEY !== 'your_emailjs_public_key') {
        const res = await emailjs.send(SERVICE_ID, TEMPLATE_WELCOME, templateParams, PUBLIC_KEY);
        console.log('[EmailJS] Welcome email sent successfully:', res.status, res.text);
        return { success: true, message: 'Welcome email sent to ' + params.to_email };
      } else {
        console.log('[EmailJS Simulation] Welcome email sent to:', params.to_email);
        return { success: true, message: `Simulated: Welcome email sent to ${params.to_email}` };
      }
    } catch (error: any) {
      console.warn('[EmailJS] Failed to send welcome email:', error?.text || error?.message || error);
      return { success: false, message: error?.text || 'Could not deliver welcome email' };
    }
  },
};

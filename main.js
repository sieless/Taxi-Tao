// Inject Vercel Analytics script
import { inject } from "@vercel/analytics";
inject();

// Menu toggle functionality
const menuButton = document.querySelector('.mobile-menu-button');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');

if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });

  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
    });
  });
}

// Set today's date as min date
const dateInput = document.getElementById('date');
if (dateInput) {
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
}

// WhatsApp booking form logic
const bookingForm = document.getElementById('bookingForm');
const whatsappBookingBtn = document.getElementById('whatsappBookingBtn');
const bookingStatus = document.getElementById('bookingStatus');
const businessPhoneNumber = '+254708674665';

if (bookingForm && whatsappBookingBtn && bookingStatus) {
  whatsappBookingBtn.addEventListener('click', () => {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const pickup = document.getElementById('pickup').value.trim();
    const destination = document.getElementById('destination').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    if (!name || !phone || !pickup || !destination || !date || !time) {
      bookingStatus.textContent = 'Please fill in all required fields.';
      bookingStatus.className = 'mt-4 text-center text-red-600 font-semibold';
      Array.from(bookingForm.elements).forEach(el => {
        if (el.required && !el.value) {
          el.classList.add('border-red-500');
          el.classList.remove('border-gray-300');
        } else {
          el.classList.remove('border-red-500');
          el.classList.add('border-gray-300');
        }
      });
      return;
    }

    bookingStatus.textContent = '';
    bookingStatus.className = 'mt-4 text-center';
    Array.from(bookingForm.elements).forEach(el => {
      el.classList.remove('border-red-500');
      if (el.type !== 'button') el.classList.add('border-gray-300');
    });

    const pickupDate = new Date(date);
    const formattedDate = pickupDate.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    const message = `*New Taxi Booking Request*:\n\n` +
      `*Name*: ${name}\n` +
      `*Phone*: ${phone}\n` +
      `*Pickup Location*: ${pickup}\n` +
      `*Destination*: ${destination}\n` +
      `*Date*: ${formattedDate}\n` +
      `*Time*: ${time}\n\n` +
      `Please confirm availability.`;

    const whatsappUrl = `https://wa.me/${businessPhoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    bookingStatus.textContent = 'Your booking request is being redirected to WhatsApp...';
    bookingStatus.className = 'mt-4 text-center text-green-600 font-semibold';
  });
}

// Set current year in footer
const currentYearElement = document.getElementById('currentYear');
if (currentYearElement) {
  currentYearElement.textContent = new Date().getFullYear();
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Fix "Call Now" button functionality
document.addEventListener('DOMContentLoaded', () => {
  const callButtons = document.querySelectorAll('.call-now-btn');
  callButtons.forEach(button => {
    const phoneNumber = button.closest('.contact-container').querySelector('.phone-number').textContent.trim();
    button.setAttribute('href', `tel:${phoneNumber}`);
  });
});

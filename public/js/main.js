// ============================================
// KosFindr - Main JavaScript
// ============================================

// Toggle Password Visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(inputId + '-icon');
  
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.classList.remove('bi-eye');
      icon.classList.add('bi-eye-slash');
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.classList.remove('bi-eye-slash');
      icon.classList.add('bi-eye');
    }
  }
}

// Image Preview
document.addEventListener('DOMContentLoaded', () => {
  const imageInput = document.getElementById('images');
  const imagePreview = document.getElementById('imagePreview');

  if (imageInput && imagePreview) {
    imageInput.addEventListener('change', (e) => {
      imagePreview.innerHTML = '';
      const files = e.target.files;

      if (files.length > 5) {
        alert('Maksimal 5 foto!');
        imageInput.value = '';
        return;
      }

      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const img = document.createElement('img');
            img.src = ev.target.result;
            img.classList.add('rounded');
            imagePreview.appendChild(img);
          };
          reader.readAsDataURL(file);
        }
      });
    });
  }

  // Auto-dismiss alerts after 5 seconds
  const alerts = document.querySelectorAll('.alert-dismissible');
  alerts.forEach(alert => {
    setTimeout(() => {
      const closeBtn = alert.querySelector('.btn-close');
      if (closeBtn) closeBtn.click();
    }, 5000);
  });

  // Format currency input
  const priceInput = document.getElementById('price_monthly');
  if (priceInput) {
    priceInput.addEventListener('input', (e) => {
      // Remove non-numeric
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

// Confirm delete
function confirmDelete(message) {
  return confirm(message || 'Yakin ingin menghapus?');
}

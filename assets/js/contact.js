// Inputs
const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const subject = document.getElementById("subject");
const message = document.getElementById("message");
const form = document.getElementById("contactForm");

// Error elements
const errorMessages = {
  firstName: document.getElementById("firstNameError"),
  lastName: document.getElementById("lastNameError"),
  email: document.getElementById("emailError"),
  phone: document.getElementById("phoneError"),
  subject: document.getElementById("subjectError"),
  message: document.getElementById("messageError"),
};

// Regex
const regexName = /^[A-Za-zÀ-ÿ\s]{2,}$/; // uniquement lettres
const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const regexPhone = /^[0-9]{8,}$/; // chiffres et min 8 chars

function validateField(input, regex, errorElement, errorMessage) {
  if (!regex.test(input.value.trim())) {
    input.classList.add("invalid");
    input.classList.remove("valid");

    // shake animation
    input.classList.add("shake");
    setTimeout(() => input.classList.remove("shake"), 300);

    errorElement.innerText = errorMessage;
    return false;
  }

  input.classList.add("valid");
  input.classList.remove("invalid");
  errorElement.innerText = "";
  return true;
}

// ✅ Validation en temps réel
firstName.addEventListener("input", () =>
  validateField(firstName, regexName, errorMessages.firstName, "Letters only, min 2 characters")
);

lastName.addEventListener("input", () =>
  validateField(lastName, regexName, errorMessages.lastName, "Letters only, min 2 characters")
);

email.addEventListener("input", () =>
  validateField(email, regexEmail, errorMessages.email, "Invalid email address")
);

phone.addEventListener("input", () =>
  validateField(phone, regexPhone, errorMessages.phone, "Phone must be numbers (min 8 digits)")
);

// Message (min 10 chars, no regex)
message.addEventListener("input", () => {
  if (message.value.trim().length < 10) {
    message.classList.add("invalid");
    message.classList.remove("valid");
    errorMessages.message.innerText = "Message must be at least 10 characters";
  } else {
    message.classList.add("valid");
    message.classList.remove("invalid");
    errorMessages.message.innerText = "";
  }
});

// Subject
subject.addEventListener("change", () => {
  if (subject.value === "") {
    subject.classList.add("invalid");
    errorMessages.subject.innerText = "Please select a subject";
  } else {
    subject.classList.add("valid");
    subject.classList.remove("invalid");
    errorMessages.subject.innerText = "";
  }
});

// ✅ Validation finale avant envoi
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const isValid =
    validateField(firstName, regexName, errorMessages.firstName, "Invalid name") &&
    validateField(lastName, regexName, errorMessages.lastName, "Invalid name") &&
    validateField(email, regexEmail, errorMessages.email, "Invalid email") &&
    validateField(phone, regexPhone, errorMessages.phone, "Invalid phone number") &&
    message.value.trim().length >= 10 &&
    subject.value !== "";

  if (isValid) {
    document.getElementById("successModal").style.display = "flex";
    form.reset(); // reset form after submit

    // remove green borders after reset
    document.querySelectorAll("input, textarea, select").forEach(el => {
      el.classList.remove("valid");
    });
  }
});

// Close success modal
document.getElementById("modalClose").addEventListener("click", () => {
  document.getElementById("successModal").style.display = "none";
});

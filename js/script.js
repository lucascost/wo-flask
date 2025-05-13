document.addEventListener('DOMContentLoaded', function() {
    // Local Storage Keys
    const STORAGE_KEY = 'whatsapp_saved_numbers';
    
    // Get DOM elements
    // Form elements
    const form = document.getElementById('whatsapp-form');
    const countryCodeSelect = document.getElementById('country-code');
    const phoneNumberInput = document.getElementById('phone-number');
    const messageTextarea = document.getElementById('message-text');
    const saveNumberCheckbox = document.getElementById('save-number');
    const contactNameContainer = document.getElementById('contact-name-container');
    const contactNameInput = document.getElementById('contact-name');
    const saveMessage = document.getElementById('save-message');
    const generateBtn = document.getElementById('generate-btn');
    const resultContainer = document.getElementById('result-container');
    const whatsappLinkInput = document.getElementById('whatsapp-link');
    const copyBtn = document.getElementById('copy-btn');
    const openChatBtn = document.getElementById('open-chat-btn');
    const copyMessage = document.getElementById('copy-message');
    const validationMessage = document.getElementById('validation-message');
    
    // Tab elements
    const tabGeneratorLink = document.getElementById('tab-generator-link');
    const tabSavedLink = document.getElementById('tab-saved-link');
    const tabGenerator = document.getElementById('tab-generator');
    const tabSaved = document.getElementById('tab-saved');
    
    // Saved contacts elements
    const noContactsMessage = document.querySelector('.no-contacts-message');
    const savedContactsList = document.getElementById('saved-contacts-list');
    
    // Function to save a phone number to local storage
    function savePhoneNumber(countryCode, phoneNumber, contactName = '') {
        try {
            // Get existing saved numbers from local storage
            let savedNumbers = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            
            // Create a new entry with country code, phone number, and contact name
            const newEntry = {
                countryCode: countryCode,
                phoneNumber: phoneNumber,
                contactName: contactName.trim(),
                timestamp: new Date().toISOString()
            };
            
            // Check if this number already exists
            const existingIndex = savedNumbers.findIndex(entry => 
                entry.countryCode === countryCode && entry.phoneNumber === phoneNumber);
                
            if (existingIndex === -1) {
                // Number doesn't exist yet, add it to the beginning of the array
                savedNumbers.unshift(newEntry);
            } else {
                // Number exists, update it with new contact name (if provided) or keep existing
                if (contactName.trim() || !savedNumbers[existingIndex].contactName) {
                    savedNumbers[existingIndex].contactName = contactName.trim();
                }
                savedNumbers[existingIndex].timestamp = newEntry.timestamp;
                
                // Move it to the beginning of the array (most recent)
                const updatedEntry = savedNumbers.splice(existingIndex, 1)[0];
                savedNumbers.unshift(updatedEntry);
            }
            
            // Keep only the last 10 entries to avoid excessive storage
            if (savedNumbers.length > 10) {
                savedNumbers = savedNumbers.slice(0, 10);
            }
            
            // Save back to local storage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedNumbers));
            return true;
        } catch (error) {
            console.error('Erro ao salvar no localstorage:', error);
            return false;
        }
    }
    
    // Function to load the most recent phone number
    function loadLastPhoneNumber() {
        try {
            const savedNumbers = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            if (savedNumbers.length > 0) {
                // Get the most recent entry (first in the array)
                const lastEntry = savedNumbers[0];
                return lastEntry;
            }
            return null;
        } catch (error) {
            console.error('Erro ao carregar do localstorage:', error);
            return null;
        }
    }
    
    // Function to load all saved contacts
    function loadAllContacts() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (error) {
            console.error('Erro ao carregar contatos do localstorage:', error);
            return [];
        }
    }
    
    // Function to delete a contact
    function deleteContact(index) {
        try {
            const savedContacts = loadAllContacts();
            
            if (index >= 0 && index < savedContacts.length) {
                // Remove the contact at the specified index
                savedContacts.splice(index, 1);
                
                // Save the updated contacts list back to local storage
                localStorage.setItem(STORAGE_KEY, JSON.stringify(savedContacts));
                
                // Refresh the contacts list
                renderSavedContacts();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erro ao remover contato:', error);
            return false;
        }
    }
    
    // Function to format date
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Data inválida';
        }
    }
    
    // Try to load the last saved phone number on page load
    contactNameContainer.style.display = 'none';
    contactNameContainer.classList.add('hidden');

    // Phone number validation function
    function validatePhoneNumber(phoneNumber) {
        // Remove any non-digit characters
        const digitsOnly = phoneNumber.replace(/\D/g, '');
        
        // Check if the phone is empty
        if (digitsOnly === '') {
            return {
                isValid: false,
                message: 'O número de telefone é obrigatório'
            };
        }
        
        // Check if the phone has only digits
        if (phoneNumber !== digitsOnly) {
            return {
                isValid: false,
                message: 'O telefone deve conter apenas números'
            };
        }
        
        // Check if the phone has a reasonable length (most phone numbers are between 7 and 15 digits)
        if (digitsOnly.length < 7) {
            return {
                isValid: false,
                message: 'O telefone digitado é muito curto'
            };
        }
        
        if (digitsOnly.length > 15) {
            return {
                isValid: false,
                message: 'O telefone digitado é muito longo'
            };
        }
        
        return {
            isValid: true,
            message: 'O número de telefone é válido',
            cleanedNumber: digitsOnly
        };
    }

    // Function to create WhatsApp link
    function createWhatsAppLink(countryCode, phoneNumber, message = '') {
        // Remove the plus sign from the country code if it exists
        const cleanedCountryCode = countryCode.replace('+', '');
        
        // Combine country code and phone number
        const fullPhoneNumber = cleanedCountryCode + phoneNumber;
        
        // Create the base WhatsApp link
        let whatsappLink = `https://wa.me/${fullPhoneNumber}`;
        
        // If a message is provided, add it to the link
        if (message.trim()) {
            // Encode the message for URL
            const encodedMessage = encodeURIComponent(message);
            whatsappLink += `?text=${encodedMessage}`;
        }
        
        return whatsappLink;
    }

    // Function to handle form submission
    function handleSubmit(event) {
        event.preventDefault();
        
        const countryCode = countryCodeSelect.value;
        const phoneNumber = phoneNumberInput.value;
        const message = messageTextarea.value || '';
        const saveNumber = saveNumberCheckbox.checked;
        
        // Validate phone number
        const validation = validatePhoneNumber(phoneNumber);
        
        if (!validation.isValid) {
            validationMessage.textContent = validation.message;
            validationMessage.classList.remove('valid');
            resultContainer.classList.add('hidden');
            phoneNumberInput.classList.add('validated');
            return;
        }
        
        // If valid, update UI
        validationMessage.textContent = validation.message;
        validationMessage.classList.add('valid');
        phoneNumberInput.classList.add('validated');
        
        // Save the phone number to local storage if checkbox is checked
        if (saveNumber) {
            // Hide any previous save message
            saveMessage.classList.add('hidden');
            
            // Get the contact name if provided
            const contactName = contactNameInput.value || '';
            
            // Save with the contact name
            const saved = savePhoneNumber(countryCode, validation.cleanedNumber, contactName);
            if (saved) {
                // Show save message
                const displayName = contactName ? ` (${contactName})` : '';
                saveMessage.textContent = `Number${displayName} Salvo! Esse número aparecerá automaticamente na próxima vez.`;
                saveMessage.classList.remove('hidden');
                
                // Hide the message after 3 seconds
                setTimeout(() => {
                    saveMessage.classList.add('hidden');
                }, 3000);
                
                // If the saved contacts tab is visible, refresh the contacts list
                if (tabSaved.classList.contains('active')) {
                    renderSavedContacts();
                }
            }
        } else {
            // Make sure the save message is hidden
            saveMessage.classList.add('hidden');
        }
        
        // Generate the WhatsApp link with optional message
        const whatsappLink = createWhatsAppLink(countryCode, validation.cleanedNumber, message);
        
        // Display the result
        whatsappLinkInput.value = whatsappLink;
        resultContainer.classList.remove('hidden');
        copyMessage.classList.add('hidden');
    }

    // Function to copy link to clipboard
    function copyLinkToClipboard() {
        whatsappLinkInput.select();
        whatsappLinkInput.setSelectionRange(0, 99999); // For mobile devices
        
        // Copy the text inside the text field
        navigator.clipboard.writeText(whatsappLinkInput.value)
            .then(() => {
                // Show copy success message
                copyMessage.classList.remove('hidden');
                setTimeout(() => {
                    copyMessage.classList.add('hidden');
                }, 3000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Falha ao copiar! Tente novamente ou copie manualmente');
            });
    }

    // Function to open WhatsApp chat
    function openWhatsAppChat() {
        const whatsappLink = whatsappLinkInput.value;
        window.open(whatsappLink, '_blank');
    }

    // Real-time validation as user types
    phoneNumberInput.addEventListener('input', function() {
        const validation = validatePhoneNumber(this.value);
        
        if (this.value) {
            validationMessage.textContent = validation.message;
            validationMessage.classList.toggle('valid', validation.isValid);
            this.classList.add('validated');
        } else {
            validationMessage.textContent = '';
            this.classList.remove('validated');
        }
    });

    // Function to toggle contact name input visibility
    function toggleContactNameInput() {
        console.log('Toggle contact name input:', saveNumberCheckbox.checked);
        
        if (saveNumberCheckbox.checked) {
            // Show the contact name input
            contactNameContainer.style.display = 'block';
            contactNameContainer.classList.remove('hidden');
            
            // Focus on the input to prompt user to enter name
            setTimeout(() => {
                if (contactNameInput) {
                    contactNameInput.focus();
                }
            }, 100);
        } else {
            // Hide the contact name input
            contactNameContainer.style.display = 'none';
            contactNameContainer.classList.add('hidden');
        }
    }
    
    // Function to switch tabs
    function switchTab(tabId) {
        console.log('Switching to tab:', tabId);
        
        // Hide all tab panes
        const allPanes = document.querySelectorAll('.tab-pane');
        allPanes.forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Remove active class from all tab links
        const allLinks = document.querySelectorAll('.tabs-nav a');
        allLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Show the selected tab pane
        const selectedPane = document.getElementById(tabId);
        if (selectedPane) {
            selectedPane.classList.add('active');
        } else {
            console.error('Tab pane not found:', tabId);
        }
        
        // Add active class to the selected tab link
        const selectedLink = document.querySelector(`a[aria-controls="${tabId}"]`);
        if (selectedLink) {
            selectedLink.classList.add('active');
        } else {
            console.error('Tab link not found for:', tabId);
        }
        
        // If switching to saved contacts tab, refresh the contacts list
        if (tabId === 'tab-saved') {
            renderSavedContacts();
        }
    }
    
    // Function to render the saved contacts list
    function renderSavedContacts() {
        const contacts = loadAllContacts();
        
        // Show/hide the "no contacts" message based on whether there are any contacts
        if (contacts.length === 0) {
            noContactsMessage.style.display = 'block';
            savedContactsList.classList.add('hidden');
            return;
        }
        
        // Hide the "no contacts" message and show the contacts list
        noContactsMessage.style.display = 'none';
        savedContactsList.classList.remove('hidden');
        
        // Clear the current list
        savedContactsList.innerHTML = '';
        
        // Create a contact card for each saved contact
        contacts.forEach((contact, index) => {
            const contactName = contact.contactName || 'Unnamed Contact';
            const contactNumber = `${contact.countryCode} ${contact.phoneNumber}`;
            const date = formatDate(contact.timestamp);
            
            const card = document.createElement('div');
            card.className = 'contact-card';
            card.innerHTML = `
                <div class="contact-header">
                    <h3 class="contact-name">${contactName}</h3>
                    <button type="button" class="delete-contact" data-index="${index}">Remover</button>
                </div>
                <p class="contact-number">${contactNumber}</p>
                <div class="contact-actions">
                    <button type="button" class="use-contact secondary" data-index="${index}">Usar esse número</button>
                    <button type="button" class="chat-with-contact" data-index="${index}">Conversar agora</button>
                </div>
                <p class="contact-date">Salvo em ${date}</p>
            `;
            
            savedContactsList.appendChild(card);
        });
        
        // Add event listeners to the contact action buttons
        addContactActionListeners();
    }
    
    // Function to add event listeners to contact action buttons
    function addContactActionListeners() {
        // Delete contact buttons
        document.querySelectorAll('.delete-contact').forEach(button => {
            button.addEventListener('click', function(event) {
                const index = parseInt(event.target.dataset.index);
                if (confirm('Quer mesmo remover esse contato?')) {
                    deleteContact(index);
                }
            });
        });
        
        // Use contact buttons
        document.querySelectorAll('.use-contact').forEach(button => {
            button.addEventListener('click', function(event) {
                const index = parseInt(event.target.dataset.index);
                const contacts = loadAllContacts();
                const contact = contacts[index];
                
                // Switch to the generator tab
                switchTab('tab-generator');
                
                // Fill in the form with the contact's details
                countryCodeSelect.value = contact.countryCode;
                phoneNumberInput.value = contact.phoneNumber;
                
                // If there's a contact name, check the save box and show the name
                if (contact.contactName) {
                    saveNumberCheckbox.checked = true;
                    contactNameInput.value = contact.contactName;
                    
                    // Explicitly show the contact name container
                    contactNameContainer.style.display = 'block';
                    contactNameContainer.classList.remove('hidden');
                } else {
                    saveNumberCheckbox.checked = false;
                    contactNameContainer.style.display = 'none';
                    contactNameContainer.classList.add('hidden');
                }
                
                // Trigger validation
                const inputEvent = new Event('input');
                phoneNumberInput.dispatchEvent(inputEvent);
                
                // Focus on the message textarea for the next step
                messageTextarea.focus();
            });
        });
        
        // Chat with contact buttons
        document.querySelectorAll('.chat-with-contact').forEach(button => {
            button.addEventListener('click', function(event) {
                const index = parseInt(event.target.dataset.index);
                const contacts = loadAllContacts();
                const contact = contacts[index];
                
                // Create WhatsApp link and open it
                const whatsappLink = createWhatsAppLink(contact.countryCode, contact.phoneNumber);
                window.open(whatsappLink, '_blank');
            });
        });
    }

    // Event listeners
    form.addEventListener('submit', handleSubmit);
    copyBtn.addEventListener('click', copyLinkToClipboard);
    openChatBtn.addEventListener('click', openWhatsAppChat);
    
    // Toggle contact name input when checkbox is clicked
    saveNumberCheckbox.addEventListener('change', toggleContactNameInput);
    
    // Tab navigation event listeners
    tabGeneratorLink.addEventListener('click', function(event) {
        event.preventDefault();
        switchTab('tab-generator');
    });
    
    tabSavedLink.addEventListener('click', function(event) {
        event.preventDefault();
        switchTab('tab-saved');
    });
});

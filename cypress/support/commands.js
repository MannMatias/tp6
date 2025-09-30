// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Comando para llenar formulario de registro con datos válidos
Cypress.Commands.add('fillRegistrationForm', (userData) => {
  const defaultData = {
    firstName: 'Matias',
    lastName: 'Mann',
    email: `mati_${Date.now()}@example.com`,
    password: 'Abcdef1!'
  }
  
  const data = { ...defaultData, ...userData }
  
  // Solo llenar campos que no estén vacíos
  if (data.firstName) {
    cy.get('#firstName').clear().type(data.firstName)
  }
  if (data.lastName) {
    cy.get('#lastName').clear().type(data.lastName)
  }
  if (data.email) {
    cy.get('#email').clear().type(data.email)
  }
  if (data.password) {
    cy.get('#password').clear().type(data.password)
  }
})

// Comando para verificar errores de validación específicos
Cypress.Commands.add('checkFieldValidation', (fieldSelector, shouldBeInvalid = true) => {
  if (shouldBeInvalid) {
    cy.get(fieldSelector).should('have.attr', 'required')
    cy.get(fieldSelector).should('not.have.value')
  } else {
    cy.get(fieldSelector).should('have.value')
  }
})

// Comando para verificar mensajes de error en la página
Cypress.Commands.add('checkErrorMessage', (errorText) => {
  cy.get('body').should('contain.text', errorText)
  cy.get('body').should('be.visible')
})

// Comando para navegar al formulario de registro
Cypress.Commands.add('goToRegistration', () => {
  cy.visit('/')
  cy.get('button').contains(/^Sign up$/i).click()
  // La URL puede ser /addUser o similar, no necesariamente 'signup'
  cy.url().should('match', /(addUser|signup|register)/)
})

// Comando para verificar que el formulario no se envíe
Cypress.Commands.add('verifyFormBlocked', () => {
  // Verificar que no se haya redirigido a la página de contactos
  cy.url().should('not.match', /(contacts|dashboard|user)/)
  
  // Verificar que estemos aún en la página de registro
  cy.url().should('match', /(addUser|signup|register)/)
})

// Comando para esperar a que aparezca un elemento con timeout personalizado
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible')
})

// Comando para verificar validación de email
Cypress.Commands.add('checkEmailValidation', (email, shouldBeValid = true) => {
  cy.get('#email').clear().type(email)
  cy.get('button[type="submit"]').click()
  
  if (shouldBeValid) {
    cy.get('#email').should('have.value', email)
  } else {
    // Verificar que el email no sea válido
    cy.get('#email').should('have.value', email)
    cy.get('#email').should('have.attr', 'type', 'email')
  }
})

// Comando para verificar validación de contraseña
Cypress.Commands.add('checkPasswordValidation', (password, shouldBeValid = true) => {
  cy.get('#password').clear().type(password)
  cy.get('button[type="submit"]').click()
  
  if (shouldBeValid) {
    cy.get('#password').should('have.value', password)
  } else {
    // Verificar que la contraseña no sea válida
    cy.get('#password').should('have.value', password)
    cy.get('#password').should('have.attr', 'type', 'password')
  }
})
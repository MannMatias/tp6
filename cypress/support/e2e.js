// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Configuración global para mejor detección de errores
Cypress.on('uncaught:exception', (err, runnable) => {
  // Evita que Cypress falle por errores de JavaScript no capturados
  // que no están relacionados con nuestras pruebas
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false
  }
  // Para otros errores, permite que Cypress los maneje normalmente
  return true
})

// Configuración para mejor logging de errores
Cypress.on('fail', (error, runnable) => {
  // Log personalizado cuando una prueba falla
  console.error('Test failed:', runnable.title)
  console.error('Error:', error.message)
  
  // Tomar screenshot en caso de fallo
  cy.screenshot(`failed-${runnable.title.replace(/\s+/g, '-').toLowerCase()}`)
  
  // Re-lanzar el error para que Cypress lo maneje
  throw error
})

// Configuración para mejor detección de elementos
Cypress.Commands.add('getElementByText', (text, options = {}) => {
  return cy.contains(text, options)
})

// Comando personalizado para verificar errores de validación
Cypress.Commands.add('verifyValidationError', (fieldSelector, expectedError) => {
  cy.get(fieldSelector).should('be.invalid')
  cy.get(fieldSelector).should('have.attr', 'required')
  
  // Verificar que el campo tenga el estado :invalid
  cy.get(`${fieldSelector}:invalid`).should('exist')
  
  // Verificar mensaje de error en el DOM
  cy.get('body').should('contain.text', expectedError)
})

// Comando para esperar y verificar que aparezca un error
Cypress.Commands.add('waitForError', (errorText, timeout = 5000) => {
  cy.contains(errorText, { timeout }).should('be.visible')
})

// Comando para verificar que un formulario no se envíe
Cypress.Commands.add('verifyFormNotSubmitted', () => {
  // Verificar que todos los campos requeridos estén invalid
  cy.get('input[required]').each(($el) => {
    cy.wrap($el).should('be.invalid')
  })
  
  // Verificar que no se haya redirigido
  cy.url().should('not.include', '/contacts')
  cy.url().should('not.include', '/dashboard')
})
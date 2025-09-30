/// <reference types="cypress" />

// Helpers básicos
const BASE_URL = 'https://thinking-tester-contact-list.herokuapp.com/';

const selectors = {
  email: '#email',            // Ajustar si cambia
  password: '#password',      // Ajustar si cambia
  submit: '#submit',          // Ajustar si cambia
  error: '#error',            // Ajustar si cambia
  contactsHeader: 'h1',       // "Contact List" al ingresar
  logoutBtn: '#logout'        // Ajustar si cambia
};

// Para no versionar credenciales, usá cypress.env.json (EMAIL y PASSWORD)
// o variables de entorno del runner.
const VALID_EMAIL = Cypress.env('EMAIL') || 'usuario.demo+login@tester.com';
const VALID_PASSWORD = Cypress.env('PASSWORD') || 'Demo1234!';

describe('Inicio de sesión - Contact List App', () => {
  beforeEach(() => {
    cy.visit(BASE_URL);
    // Asegura que estamos en la pantalla de Login
    cy.contains('Log In', { matchCase: false }).should('be.visible');
  });

  it('AC1 + AC4: con credenciales válidas inicia sesión y accede al módulo de contactos', () => {
    // Completar el form
    cy.get(selectors.email).should('be.visible').clear().type(VALID_EMAIL);
    cy.get(selectors.password).should('be.visible').clear().type(VALID_PASSWORD);

    // Enviar
    cy.get(selectors.submit).should('be.enabled').click();

    // Verificación: aterriza en Contact List (módulo de contactos)
    cy.url().should('include', '/contactList'); // La app suele redirigir a /contactList
    cy.contains('Contact List').should('be.visible'); // Header presente
    // Smoke: existe botón para agregar contacto o logout
    cy.contains(/add a new contact/i).should('exist');
    cy.get(selectors.logout).should('exist');
  });

  it('AC2: con credenciales inválidas muestra mensaje de error', () => {
    const wrongPass = 'ClaveInvalida!1';
    cy.get(selectors.email).clear().type(VALID_EMAIL);
    cy.get(selectors.password).clear().type(wrongPass);
    cy.get(selectors.submit).click();

    // Mensaje de error visible (típicamente #error con texto "Incorrect username or password")
    cy.get(selectors.error)
      .should('be.visible')
      .and(($el) => {
        const txt = $el.text().toLowerCase();
        expect(
          txt.includes('incorrect') || txt.includes('error') || txt.includes('inválid')
        ).to.eq(true);
      });

    // No debe navegar al módulo de contactos
    cy.url().should('not.include', '/contactList');
    cy.contains('Contact List').should('not.exist');
  });

  it('Validación de campos del Login (form vació o email inválido impide enviar)', () => {
    // Submit vacío
    cy.get(selectors.submit).click();
    // El navegador suele marcar required, así que seguimos en login
    cy.url().should('eq', BASE_URL);

    // Email inválido
    cy.get(selectors.email).clear().type('no-es-un-email');
    cy.get(selectors.password).clear().type('Algo1234!');
    cy.get(selectors.submit).click();

    // De nuevo, nos quedamos en login; si el sitio usa validación nativa, no envía
    cy.url().should('eq', BASE_URL);
  });

  it.skip('AC3: no permite iniciar sesión si la cuenta no está verificada (escenario de negocio)', () => {
    /**
     * NOTA IMPORTANTE PARA EL INFORME:
     * El entorno demo público no implementa flujo de verificación de email,
     * por lo que no es posible reproducir este AC de forma real end-to-end.
     *
     * Cómo validarlo en un proyecto real:
     * - Preparar usuario estado "unverified" vía API/fixture.
     * - Intentar login y esperar mensaje "Debes verificar tu email" y rechazo.
     *
     * Dejo el test marcado como skip para documentar el gap entre requerimiento y el sandbox.
     */
  });
});

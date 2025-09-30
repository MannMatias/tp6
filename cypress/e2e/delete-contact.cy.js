/// <reference types="cypress" />

// ===================== Helpers locales (no registran Cypress.Commands) =====================

// Tipear por label si no existen los IDs esperados (fallback robusto)
const typeByLabel = (labelText, value) => {
  cy.contains('label', new RegExp(`^${labelText}\\s*:?$`, 'i'))
    .invoke('attr', 'for')
    .then((id) => {
      expect(id, `label "${labelText}" debe tener atributo 'for'`).to.be.a('string');
      cy.get(`#${id}`).should('be.visible').clear().type(value);
    });
};

// Completar formulario de registro. Usa IDs si están, sino cae en labels.
const fillRegistrationForm = (user) => {
  cy.get('body').then(($b) => {
    const hasIds =
      $b.find('#firstName').length > 0 &&
      $b.find('#lastName').length > 0 &&
      $b.find('#email').length > 0 &&
      $b.find('#password').length > 0;

    if (hasIds) {
      cy.get('#firstName').clear().type(user.firstName);
      cy.get('#lastName').clear().type(user.lastName);
      cy.get('#email').clear().type(user.email);
      cy.get('#password').clear().type(user.password, { log: false });
    } else {
      typeByLabel('First Name', user.firstName);
      typeByLabel('Last Name', user.lastName);
      typeByLabel('Email', user.email);
      typeByLabel('Password', user.password);
    }
  });
};

// Volver a la lista si estamos en el detalle (tras cancelar/confirmar delete)
const backToList = () => {
  cy.get('body').then(($b) => {
    const alreadyOnList = /Add a New Contact/i.test($b.text());
    if (!alreadyOnList) {
      cy.contains(/Return to contact list/i, { timeout: 10000 }).click();
    }
  });
  cy.contains(/Add a New Contact/i, { timeout: 10000 }).should('be.visible');
};

// Crear un contacto por UI. Usa IDs si están; si no, labels.
const addContactUI = (c) => {
  cy.contains(/Add a New Contact/i, { timeout: 10000 }).click();

  cy.get('body').then(($b) => {
    const hasIds =
      $b.find('#firstName').length > 0 &&
      $b.find('#lastName').length > 0;

    if (hasIds) {
      cy.get('#firstName').clear().type(c.firstName);
      cy.get('#lastName').clear().type(c.lastName);
      if (c.email) cy.get('#email').clear().type(c.email);
    } else {
      typeByLabel('First Name', c.firstName);
      typeByLabel('Last Name', c.lastName);
      if (c.email) typeByLabel('Email', c.email);
    }
  });

  cy.get('button[type="submit"], input[type="submit"]').click();
  cy.contains(/Add a New Contact/i, { timeout: 10000 }).should('be.visible');
  cy.contains(`${c.firstName} ${c.lastName}`).should('be.visible');
};

// ===========================================================================================

describe('Eliminación de contacto', () => {
  const BASE = 'https://thinking-tester-contact-list.herokuapp.com/';

  beforeEach(function () {
    cy.viewport(1280, 900);

    // Datos únicos para evitar colisiones entre corridas
    const unique = Date.now();
    const user = {
      firstName: 'Bauti',
      lastName: 'QA',
      email: `bauti_${unique}@example.com`,
      password: 'P4ssword!'
    };

    const c1 = { firstName: 'Ana',  lastName: 'Pérez', email: `ana_${unique}@example.com` };
    const c2 = { firstName: 'Luis', lastName: 'Gómez', email: `luis_${unique}@example.com` };

    // Guardamos para acceder con "this" en los tests
    this.user = user;
    this.c1 = c1;
    this.c2 = c2;

    // Ir a Sign up
    cy.visit(BASE);
    cy.get('a,button').contains(/^Sign up$/i).should('be.visible').click();
    cy.url().should('match', /(adduser|signup|register)/i);

    // Registrar usuario
    fillRegistrationForm(user);
    cy.get('button[type="submit"], input[type="submit"]')
      .contains(/submit|sign up|create|register/i)
      .click();

    // Debe quedar autenticado y en la lista de contactos
    cy.contains(/Add a New Contact/i, { timeout: 10000 }).should('be.visible');

    // Crear 2 contactos de prueba
    addContactUI(c1);
    addContactUI(c2);
  });

  it('AC2 + AC3: solicita confirmación y, al aceptar, el contacto desaparece de la lista', function () {
    // Abrir detalle del primer contacto
    cy.contains(`${this.c1.firstName} ${this.c1.lastName}`).click();

    let confirmText = '';
    cy.on('window:confirm', (txt) => {
      confirmText = txt;
      return true; // aceptar borrado
    });

    cy.contains(/Delete/i).click().then(() => {
      // AC2: se mostró confirm
      expect(confirmText).to.match(/(delete|borrar|sure|¿estás seguro)/i);
    });

    // Aseguro volver/lista y verificar ausencia inmediata (AC3)
    backToList();
    cy.contains(`${this.c1.firstName} ${this.c1.lastName}`).should('not.exist');
  });

  it('AC1: puedo eliminar otro contacto que yo mismo creé (primero cancelo, luego confirmo)', function () {
    // 1) Cancelar: NO debe borrarse
    cy.contains(`${this.c2.firstName} ${this.c2.lastName}`).click();
    cy.on('window:confirm', () => false);
    cy.contains(/Delete/i).click();

    backToList();
    cy.contains(`${this.c2.firstName} ${this.c2.lastName}`).should('be.visible');

    // 2) Confirmar: ahora sí debe borrarse
    cy.contains(`${this.c2.firstName} ${this.c2.lastName}`).click();
    cy.on('window:confirm', () => true);
    cy.contains(/Delete/i).click();

    backToList();
    cy.contains(`${this.c2.firstName} ${this.c2.lastName}`).should('not.exist');
  });
});

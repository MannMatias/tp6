// cypress/e2e/createContact.cy.js
/// <reference types="cypress" />

describe('Creación de contacto - casos negativos', () => {
  beforeEach(() => {
    // Registrar y loguear un usuario nuevo para cada prueba
    const user = {
      firstName: 'Test',
      lastName: 'User',
      email: `qa+${Date.now()}@example.com`,
      password: 'Passw0rd!'
    };

    cy.visit('https://thinking-tester-contact-list.herokuapp.com/');

    cy.get('button').contains(/^Sign up$/i).click();

    cy.get('#firstName').type(user.firstName);
    cy.get('#lastName').type(user.lastName);
    cy.get('#email').type(user.email);
    cy.get('#password').type(user.password);
    cy.get('button[type="submit"]').click();

    // Validar que estamos dentro de la app
    cy.url().should('include', '/contactList');
    cy.get('body').should('contain.text', 'Contact');

    // Ir al formulario de creación de contacto
    cy.get('#add-contact').click();
    cy.url().should('match', /(addContact|contact)/);
    cy.get('#firstName').should('be.visible');
  });

  it('muestra error si falta el First Name', () => {
    // Llenar solo lastName
    cy.get('#lastName').type('Pérez');
    cy.get('button[type="submit"]').click();

    // Verificar que no se regresa a la lista y se muestra validación
    cy.url().should('not.include', '/contactList');
    cy.get('body').should('contain.text', 'firstName');
  });

  it('muestra error si falta el Last Name', () => {
    // Llenar solo firstName
    cy.get('#firstName').type('Juan');
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/contactList');
    cy.get('body').should('contain.text', 'lastName');
  });

  it('muestra validación si el Email no tiene formato válido', () => {
    cy.get('#firstName').type('Juan');
    cy.get('#lastName').type('Pérez');
    cy.get('#email').type('correo_invalido');
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/contactList');
    cy.get('#email').should('have.value', 'correo_invalido');
  });

  it('no envía el formulario con campos vacíos', () => {
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/contactList');
    cy.get('#firstName').should('be.visible');
    cy.get('#lastName').should('be.visible');
  });
});


// Helper local para volver a la lista si es necesario
const goBackToListIfNeeded = () => {
  cy.location('pathname').then((path) => {
    if (!path.includes('/contactList')) {
      cy.get('body').then(($body) => {
        if ($body.find('#return').length) {
          cy.get('#return').click();
        } else {
          // Navegación explícita si no hay botón de retorno
          cy.visit('https://thinking-tester-contact-list.herokuapp.com/contactList');
        }
      });
    }
  });
  // Asegurar que terminamos en la lista
  cy.url({ timeout: 10000 }).should('include', '/contactList');
};

describe('Creación de contacto - casos positivos', () => {
  beforeEach(() => {
    // Registrar y loguear un usuario nuevo para cada prueba (con email altamente único y reintento)
    const userBase = {
      firstName: 'Test',
      lastName: 'User',
      password: 'Passw0rd!'
    };

    const createAndLogin = (email) => {
      cy.visit('https://thinking-tester-contact-list.herokuapp.com/');
      cy.get('button').contains(/^Sign up$/i).click();
      cy.get('#firstName').clear().type(userBase.firstName);
      cy.get('#lastName').clear().type(userBase.lastName);
      cy.get('#email').clear().type(email);
      cy.get('#password').clear().type(userBase.password);
      cy.get('button[type="submit"]').click();
    };

    const uniqueEmail = () => `qa+${Date.now()}_${Math.random().toString(36).slice(2,8)}@example.com`;

    const email1 = uniqueEmail();
    createAndLogin(email1);

    cy.location('pathname', { timeout: 8000 }).then((path) => {
      if (!path.includes('/contactList')) {
        // Reintentar con otro email
        const email2 = uniqueEmail();
        createAndLogin(email2);
      }
    });

    // Validar que estamos dentro de la app
    cy.url({ timeout: 15000 }).should('include', '/contactList');
    cy.get('body').should('contain.text', 'Contact');

    // Ir al formulario de creación de contacto
    cy.get('#add-contact', { timeout: 10000 }).should('be.visible').click();
    cy.get('#firstName', { timeout: 10000 }).should('be.visible');
  });

  it('AC1 - crea un contacto con FirstName y LastName (mínimo requerido)', () => {
    cy.get('#firstName').type('Juan');
    cy.get('#lastName').type('Pérez');
    cy.get('button[type="submit"]').click();

    // Forzar navegación a la lista
    cy.visit('https://thinking-tester-contact-list.herokuapp.com/contactList');

    // AC3 parte: aparece en la lista
    cy.url().should('include', '/contactList');
    cy.contains('Juan Pérez').should('be.visible');
  });

  it('AC2 - permite guardar con opcionales ausentes o parciales (solo email)', () => {
    const email = `juan_${Date.now()}@example.com`;
    cy.get('#firstName').type('Juan');
    cy.get('#lastName').type('Pérez');
    cy.get('#email').type(email);
    cy.get('button[type="submit"]').click();

    // Forzar navegación a la lista
    cy.visit('https://thinking-tester-contact-list.herokuapp.com/contactList');

    cy.url().should('include', '/contactList');
    cy.contains('Juan Pérez').should('be.visible');
  });

  it('AC2 - permite guardar con otros opcionales si existen (teléfono/dirección)', () => {
    const name = `Opcionales`;
    cy.get('#firstName').type(name);
    cy.get('#lastName').type('Campos');

    cy.get('body').then(($body) => {
      const typeIfExists = (selector, value) => {
        if ($body.find(selector).length) {
          cy.get(selector).clear().type(value);
        }
      };
      typeIfExists('#phone', '123456789');
      typeIfExists('#streetAddress1', 'Calle 123');
      typeIfExists('#city', 'Ciudad');
      typeIfExists('#stateProvince', 'SP');
      typeIfExists('#postalCode', '1000');
      typeIfExists('#country', 'AR');
    });

    cy.get('button[type="submit"]').click();

    // Forzar navegación a la lista
    cy.visit('https://thinking-tester-contact-list.herokuapp.com/contactList');

    cy.url().should('include', '/contactList');
    cy.contains(`${name} Campos`).should('be.visible');
  });

  it('AC3 - el contacto persiste y aparece tras recargar la lista', () => {
    const first = 'Persistente';
    const last = 'Test';
    const fullName = `${first} ${last}`;

    cy.get('#firstName').type(first);
    cy.get('#lastName').type(last);
    cy.get('button[type="submit"]').click();

    // Forzar navegación a la lista
    cy.visit('https://thinking-tester-contact-list.herokuapp.com/contactList');

    cy.url().should('include', '/contactList');
    cy.contains(fullName).should('be.visible');

    // Recargar y validar que sigue
    cy.reload();
    cy.url().should('include', '/contactList');
    cy.contains(fullName).should('be.visible');
  });

  it('acepta caracteres acentuados y espacios', () => {
    cy.get('#firstName').type('María José');
    cy.get('#lastName').type('Gómez Núñez');
    cy.get('button[type="submit"]').click();

    // Forzar navegación a la lista
    cy.visit('https://thinking-tester-contact-list.herokuapp.com/contactList');

    cy.url().should('include', '/contactList');
    cy.contains('María José Gómez Núñez').should('be.visible');
  });

  it('permite crear múltiples contactos y aparecen en la lista', () => {
    // Contacto 1
    cy.get('#firstName').type('Ana');
    cy.get('#lastName').type('López');
    cy.get('button[type="submit"]').click();

    // Forzar navegación a la lista
    cy.visit('https://thinking-tester-contact-list.herokuapp.com/contactList');

    cy.url().should('include', '/contactList');
    cy.contains('Ana López').should('be.visible');

    // Ir a crear otro
    cy.get('#add-contact').click();

    // Contacto 2
    cy.get('#firstName').type('Bruno');
    cy.get('#lastName').type('Martínez');
    cy.get('button[type="submit"]').click();

    // Forzar navegación a la lista
    cy.visit('https://thinking-tester-contact-list.herokuapp.com/contactList');

    cy.url().should('include', '/contactList');
    cy.contains('Bruno Martínez').should('be.visible');
    cy.contains('Ana López').should('be.visible');
  });
});
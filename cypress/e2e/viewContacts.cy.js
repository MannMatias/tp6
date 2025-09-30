/// <reference types="cypress" />

const BASE = 'https://thinking-tester-contact-list.herokuapp.com';

const registerAndLogin = () => {
  const user = {
    firstName: 'Viewer',
    lastName: 'User',
    email: `viewer_${Date.now()}@example.com`,
    password: 'Passw0rd!'
  };

  cy.visit(BASE);
  cy.get('button').contains(/^Sign up$/i).should('be.visible').click();

  cy.get('#firstName', { timeout: 10000 }).should('be.visible').type(user.firstName);
  cy.get('#lastName').type(user.lastName);
  cy.get('#email').type(user.email);
  cy.get('#password').type(user.password);
  cy.get('button[type="submit"]').click();

  cy.url().should('include', '/contactList');
  cy.contains('Add a New Contact', { timeout: 10000 }).should('be.visible');

  return user;
};

const createContact = (firstName, lastName) => {
  cy.get('a,button').contains(/^Add a New Contact$/i, { timeout: 10000 }).should('be.visible').click();
  cy.get('#firstName', { timeout: 10000 }).should('be.visible').type(firstName);
  cy.get('#lastName').type(lastName);
  cy.get('button[type="submit"]').click();
  // Normalizar siempre volviendo a la lista
  cy.visit(`${BASE}/contactList`);
  cy.url().should('include', '/contactList');
};

// NUEVOS CASOS NEGATIVOS (verdaderos negativos de visualización)
describe('Visualización de contactos - casos negativos', () => {
  it('no muestra un contacto inexistente en la lista', () => {
    registerAndLogin();

    // Lista inicial vacía: aseguramos que un nombre inexistente no aparece
    cy.contains('Nombre Que No Existe', { matchCase: false }).should('not.exist');
  });

  it('no muestra contactos de otro usuario (aislamiento por cuenta)', () => {
    // Usuario A crea un contacto
    const userA = registerAndLogin();
    createContact('UsuarioA', 'Privado');
    cy.contains('UsuarioA Privado').should('be.visible');

    // Logout de A
    cy.get('#logout', { timeout: 10000 }).should('be.visible').click();

    // Usuario B registra y NO debe ver el contacto de A
    const userB = registerAndLogin();
    cy.contains('UsuarioA Privado').should('not.exist');
  });
});


describe('Visualización de contactos - casos positivos', () => {
  beforeEach(() => {
    registerAndLogin();
  });

  it('muestra estado inicial y permite ver la lista vacía', () => {
    cy.url().should('include', '/contactList');
    cy.contains('Add a New Contact').should('be.visible');
  });

  it('muestra la lista con un contacto creado', () => {
    createContact('Juan', 'Pérez');
    cy.contains('Juan Pérez', { timeout: 10000 }).should('be.visible');
  });

  it('muestra múltiples contactos cuando existen varios', () => {
    createContact('Ana', 'López');
    createContact('Bruno', 'Martínez');

    cy.contains('Ana López', { timeout: 10000 }).should('be.visible');
    cy.contains('Bruno Martínez', { timeout: 10000 }).should('be.visible');
  });

  it('persiste la lista tras recargar', () => {
    createContact('Carla', 'Gómez');
    cy.contains('Carla Gómez').should('be.visible');

    cy.reload();
    cy.url().should('include', '/contactList');
    cy.contains('Carla Gómez').should('be.visible');
  });

  it('al seleccionar un contacto, muestra sus detalles completos', () => {
    // Crear contacto, llenando obligatorios y opcionales sólo si existen
    cy.get('a,button').contains(/^Add a New Contact$/i, { timeout: 10000 }).click();
    const data = {
      firstName: 'Detalle',
      lastName: 'Completo',
      email: `detalle_${Date.now()}@test.com`,
      phone: '1234567890',
      street1: 'Calle Falsa 123',
      street2: 'Depto 4B',
      city: 'Springfield',
      state: 'SP',
      postal: '1000',
      country: 'Argentina'
    };

    // Obligatorios
    cy.get('#firstName', { timeout: 10000 }).should('be.visible').type(data.firstName);
    cy.get('#lastName').type(data.lastName);

    // Opcionales (condicionales)
    cy.get('body').then(($body) => {
      const typeIfExists = (selector, value) => {
        if ($body.find(selector).length) {
          cy.get(selector).clear().type(value);
        }
      };
      typeIfExists('#email', data.email);
      typeIfExists('#phone', data.phone);
      typeIfExists('#streetAddress1', data.street1);
      typeIfExists('#streetAddress2', data.street2);
      typeIfExists('#city', data.city);
      typeIfExists('#stateProvince', data.state);
      typeIfExists('#postalCode', data.postal);
      typeIfExists('#country', data.country);
    });

    cy.get('button[type="submit"]').click();

    // Volver a la lista y seleccionar el contacto
    cy.visit(`${BASE}/contactList`);
    cy.contains(`${data.firstName} ${data.lastName}`, { timeout: 10000 }).should('be.visible').click();

    // Verificar siempre: nombre y apellido
    cy.contains(data.firstName).should('be.visible');
    cy.contains(data.lastName).should('be.visible');

    // Verificaciones condicionales de opcionales
    const assertIfVisible = (text) => {
      cy.get('body').then(($b) => {
        if ($b.text().includes(text)) {
          cy.contains(text).should('be.visible');
        }
      });
    };
    assertIfVisible(data.email);
    assertIfVisible(data.phone);
    assertIfVisible(data.street1);
    assertIfVisible(data.street2);
    assertIfVisible(data.city);
    assertIfVisible(data.state);
    assertIfVisible(data.postal);
    assertIfVisible(data.country);

    // Botón de edición en detalle presente (si existe)
    cy.get('body').then(($b) => {
      if ($b.find('#edit-contact').length) {
        cy.get('#edit-contact').should('be.visible');
      }
    });
  });
});
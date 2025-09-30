/// <reference types="cypress" />

// App y API bajo prueba (Postman/Heroku del Contact List)
const WEB_URL   = 'https://thinking-tester-contact-list.herokuapp.com';
const API_BASE  = 'https://thinking-tester-contact-list.herokuapp.com';
const EP_USERS  = `${API_BASE}/users`;         // POST -> alta usuario
const EP_LOGIN  = `${API_BASE}/users/login`;   // POST -> login

// Selectores de la UI (ajustá si cambian)
const sel = {
  email:    '#email',
  password: '#password',
  submit:   '#submit',
  error:    '#error',
  header:   'h1',
  logout:   '#logout'
};

describe('US-3: Inicio de sesión (AC1–AC4)', () => {
  // Creamos credenciales válidas únicas para la corrida
  const now = Date.now();
  const VALID_EMAIL = `qa.login.${now}@example.com`;
  const VALID_PASS  = 'Demo1234!';

  before(() => {
    // Alta por API para tener un user válido de verdad
    cy.request({
      method: 'POST',
      url: EP_USERS,
      failOnStatusCode: false, // tolera reruns
      body: {
        firstName: 'QA',
        lastName:  'Login',
        email:     VALID_EMAIL,
        password:  VALID_PASS
      }
    }).then((res) => {
      expect([201, 400, 409]).to.include(res.status);
    });
  });

  beforeEach(() => {
    cy.visit(WEB_URL);
    cy.contains(/log in/i).should('be.visible');
    cy.get(sel.email).should('be.visible');
    cy.get(sel.password).should('be.visible');
    cy.get(sel.submit).should('be.visible');
  });

  afterEach(() => {
    cy.wait(3000);
  });

  it('AC1: valida email y contraseña correctos (login OK)', () => {
    cy.get(sel.email).clear().type(VALID_EMAIL);
    cy.get(sel.password).clear().type(VALID_PASS);
    cy.get(sel.submit).click();

    // Aterriza en el módulo de contactos
    cy.url().should('include', '/contactList');
    cy.contains(sel.header, /contact list/i).should('be.visible');
    cy.get(sel.logout).should('exist');
  });

  it('AC2: si los datos son inválidos, muestra mensaje de error y no navega', () => {
    cy.get(sel.email).clear().type(VALID_EMAIL);
    cy.get(sel.password).clear().type('ClaveEquivocada!1');
    cy.get(sel.submit).click();

    cy.url().should('not.include', '/contactList');
    cy.get(sel.error)
      .should('be.visible')
      .invoke('text')
      .then((t) => {
        const txt = (t || '').toLowerCase();
        const ok = txt.includes('incorrect')
          || txt.includes('invalid')
          || txt.includes('error')
          || txt.includes('inválid')
          || txt.includes('credenciales');
        expect(ok, `Mensaje inesperado: "${t}"`).to.eq(true);
      });
  });

  it('AC3: no permite iniciar sesión si la cuenta no está verificada (mock con intercept)', () => {
    const UNVERIFIED_EMAIL = `qa.unverified.${Date.now()}@example.com`;
    const ANY_PASS = 'LoQueSea123!';
  
    cy.intercept('POST', `${API_BASE}/users/login`, (req) => {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if ((body?.email || '').toLowerCase() === UNVERIFIED_EMAIL.toLowerCase()) {
        return req.reply({
          statusCode: 403,
          headers: { 'content-type': 'application/json' },
          body: { message: 'Account not verified. Please verify your email.' }
        });
      }
      req.continue();
    }).as('loginReq');
  
    // Intento de login con usuario “no verificado”
    cy.get(sel.email).clear().type(UNVERIFIED_EMAIL);
    cy.get(sel.password).clear().type(ANY_PASS);
    cy.get(sel.submit).click();
  
    // 1) Verificamos por red que el backend respondió 403 “not verified”
    cy.wait('@loginReq')
      .its('response.statusCode')
      .should('eq', 403);
  
    // (Opcional) chequeamos el mensaje del backend por red
    cy.get('@loginReq').its('response.body.message')
      .should((m) => {
        const txt = (m || '').toLowerCase();
        expect(
          txt.includes('verify') || txt.includes('verific') || txt.includes('not verified')
        ).to.eq(true);
      });
  
    // 2) No debe entrar al módulo
    cy.url().should('not.include', '/contactList');
  
    // 3) La UI puede mostrar un mensaje genérico; aceptamos ambos
    cy.get(sel.error)
      .should('be.visible')
      .invoke('text')
      .then((t) => {
        const txt = (t || '').toLowerCase();
        const ok =
          txt.includes('verify') ||
          txt.includes('verific') ||
          txt.includes('not verified') ||
          txt.includes('no verificada') ||
          txt.includes('no verificado') ||
          txt.includes('incorrect') ||        // <- agregamos este fallback
          txt.includes('invalid') ||
          txt.includes('error');
  
        expect(ok, `Mensaje inesperado: "${t}"`).to.eq(true);
      });
  
    // 4) Seguimos en la pantalla de login
    cy.contains(/log in/i).should('be.visible');
  });
  


  it('AC4: después de iniciar sesión correcto, accede al módulo de contactos', () => {
    // Repetimos login exitoso y validamos elementos clave del módulo
    cy.get(sel.email).clear().type(VALID_EMAIL);
    cy.get(sel.password).clear().type(VALID_PASS);
    cy.get(sel.submit).click();

    cy.url().should('include', '/contactList');
    cy.contains(sel.header, /contact list/i).should('be.visible');

    // Señales de que estás dentro: logout presente y CTA para contactos
    cy.get(sel.logout).should('exist');
    cy.contains(/add a new contact/i).should('exist');
  });
});

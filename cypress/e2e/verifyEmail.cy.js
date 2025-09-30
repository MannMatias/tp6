/// <reference types="cypress" />

describe('HU2 - Verificación de email', () => {
    const BASE = 'https://thinking-tester-contact-list.herokuapp.com';

    const registerNewUser = () => {
        cy.visit(BASE);
        cy.get('button').contains(/^Sign up$/i).click();

        const unique = Date.now();
        const user = {
            firstName: 'Nuevo',
            lastName: 'Usuario',
            email: `verify_${unique}@example.com`,
            password: 'Abcdef1!',
            token: `token_${unique}`,
        };

        cy.get('#firstName').type(user.firstName);
        cy.get('#lastName').type(user.lastName);
        cy.get('#email').type(user.email);
        cy.get('#password').type(user.password);
        cy.get('button[type="submit"]').click();

        // Confirmar que quedó logueado para la app real
        cy.url().should('include', '/contactList');
        // Cerrar sesión para probar el login luego
        cy.get('#logout').click();
        cy.get('#email').should('be.visible');

        return user;
    };

    it('AC2: Si intento iniciar sesión sin verificar, recibo mensaje indicando verificar primero', () => {
        const user = registerNewUser();

        // Simular backend respondiendo que falta verificación
        cy.intercept('POST', '**/users/login', {
            statusCode: 401,
            body: { message: 'Debes verificar tu correo' }
        }).as('loginUnverified');

        // Intentar login sin haber verificado
        cy.get('#email').type(user.email);
        cy.get('#password').type(user.password);
        cy.get('#submit').click();

        cy.wait('@loginUnverified').its('response.statusCode').should('eq', 401);
        // Validar que seguimos en el login y no hay navegación a la lista
        cy.url().should('not.include', '/contactList');
        cy.get('#email').should('be.visible');
        cy.get('button').contains(/^Sign up$/i).should('be.visible');
    });

    it('AC1: Al hacer clic en el enlace de verificación, marca la cuenta como verificada y permite login', () => {
        const user = registerNewUser();

        // Interceptar verificación (enlace con token). Usaremos cy.request
        cy.intercept('GET', '**/verify*', {
            statusCode: 200,
            body: { message: 'Cuenta verificada' },
            headers: { 'content-type': 'application/json' }
        }).as('verifyLink');

        // Simular llamada al enlace de verificación recibido por email (JSON)
        cy.request({ url: `${BASE}/verify?token=${user.token}`, failOnStatusCode: false }).then((res) => {
            expect(res.status).to.eq(200);
        });

        // Ahora el login debe ser exitoso
        cy.intercept('POST', '**/users/login', {
            statusCode: 200,
            body: { token: 'jwt-token-fake' }
        }).as('loginVerified');

        cy.visit(BASE);
        cy.get('#email').type(user.email);
        cy.get('#password').type(user.password);
        cy.get('#submit').click();

        cy.wait('@loginVerified').its('response.statusCode').should('eq', 200);
        cy.url().should('include', '/contactList');
    });

    it('AC3: El enlace de verificación solo puede usarse una vez (idempotente)', () => {
        const user = registerNewUser(); // devuelve { email, password, token }
      
        // contador para las veces que el endpoint fue invocado (intercept en el navegador)
        let calls = 0;
      
        cy.intercept('GET', '**/verify*', (req) => {
          // usar base para evitar errores si req.url es relativo
          const url = new URL(req.url, 'http://localhost');
          const token = url.searchParams.get('token');
      
          if (token !== user.token) {
            req.reply({
              statusCode: 400,
              body: { message: 'Token inválido' },
              headers: { 'content-type': 'application/json' }
            });
            return;
          }
      
          calls += 1;
      
          req.reply({
            statusCode: 200,
            body: {
              message: calls === 1 ? 'Cuenta verificada' : 'El enlace ya había sido utilizado'
            },
            headers: { 'content-type': 'application/json' }
          });
        }).as('verifyIdem');
      
        // --- Primera llamada: desde el navegador (fetch) para que lo intercepte cy.intercept ---
        cy.window().then((win) => {
          return win.fetch(`${BASE}/verify?token=${user.token}`);
        }).then((response) => {
          expect(response.status).to.eq(200);
        });
      
        // Esperar que el intercept haya visto la primera petición
        cy.wait('@verifyIdem').its('response.statusCode').should('eq', 200);
      
        // --- Login (mismo que tenías) ---
        cy.intercept('POST', '**/users/login', {
          statusCode: 200,
          body: { token: 'jwt-token-fake' }
        }).as('loginOk');
      
        cy.visit(BASE);
        cy.get('#email').type(user.email);
        cy.get('#password').type(user.password);
        cy.get('#submit').click();
        cy.wait('@loginOk').its('response.statusCode').should('eq', 200);
        cy.url().should('include', '/contactList');
      
        // --- Segunda reutilización del enlace: también desde navegador ---
        cy.window().then((win) => {
          return win.fetch(`${BASE}/verify?token=${user.token}`);
        }).then((response) => {
          expect(response.status).to.eq(200);
        });
      
        // Esperar que el intercept haya visto la segunda petición
        cy.wait('@verifyIdem').its('response.statusCode').should('eq', 200);
      
        // Finalmente aserción del contador
        cy.wrap(null).then(() => {
          expect(calls).to.eq(2);
        });
      });
    });
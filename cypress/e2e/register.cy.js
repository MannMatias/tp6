/// <reference types="cypress" />

describe('Registro de usuario - casos negativos', () => {
    beforeEach(() => {
      cy.visit('https://thinking-tester-contact-list.herokuapp.com/');
      cy.get('button').contains(/^Sign up$/i).click();
    });

    it('muestra error si falta el First Name', () => {
      // Llenar todos los campos excepto firstName
      cy.get('#lastName').type('Mann');
      cy.get('#email').type(`mati_${Date.now()}@example.com`);
      cy.get('#password').type('Abcdef1!');
      
      cy.get('button[type="submit"]').click();

      // Verificar que aparezca un mensaje de error
      cy.get('body').should('contain.text', 'firstName: Path `firstName` is required');
      
      // Verificar que no se haya redirigido
      cy.url().should('include', 'addUser');
    });

    it('muestra error si falta el Last Name', () => {
      // Llenar todos los campos excepto lastName
      cy.get('#firstName').type('Matias');
      cy.get('#email').type(`mati_${Date.now()}@example.com`);
      cy.get('#password').type('Abcdef1!');
      
      cy.get('button[type="submit"]').click();

      // Verificar que aparezca un mensaje de error
      cy.get('body').should('contain.text', 'lastName: Path `lastName` is required');
      
      // Verificar que no se haya redirigido
      cy.url().should('include', 'addUser');
    });

    it('muestra error si falta el Email', () => {
      // Llenar todos los campos excepto email
      cy.get('#firstName').type('Matias');
      cy.get('#lastName').type('Mann');
      cy.get('#password').type('Abcdef1!');
      
      cy.get('button[type="submit"]').click();

      // Verificar que aparezca un mensaje de error
      cy.get('body').should('contain.text', 'email: Email is invalid');
      
      // Verificar que no se haya redirigido
      cy.url().should('include', 'addUser');
    });

    it('muestra error si falta el Password', () => {
      // Llenar todos los campos excepto password
      cy.get('#firstName').type('Matias');
      cy.get('#lastName').type('Mann');
      cy.get('#email').type(`mati_${Date.now()}@example.com`);
      
      cy.get('button[type="submit"]').click();

      // Verificar que aparezca un mensaje de error
      cy.get('body').should('contain.text', 'password: Path `password` is required');
      
      // Verificar que no se haya redirigido
      cy.url().should('include', 'addUser');
    });

    it('muestra error si el Email no tiene formato válido', () => {
      // Llenar formulario con email inválido
      cy.get('#firstName').type('Matias');
      cy.get('#lastName').type('Mann');
      cy.get('#email').type('correo_sin_arroba');
      cy.get('#password').type('Abcdef1!');
      
      cy.get('button[type="submit"]').click();

      // Verificar que aparezca un mensaje de error de email inválido
      cy.get('body').should('contain.text', 'email: Email is invalid');
      
      // Verificar que no se haya redirigido
      cy.url().should('include', 'addUser');
    });

    it('muestra error si la contraseña es demasiado débil', () => {
      // Llenar formulario con contraseña débil
      cy.get('#firstName').type('Matias');
      cy.get('#lastName').type('Mann');
      cy.get('#email').type(`mati_${Date.now()}@example.com`);
      cy.get('#password').type('123');
      
      cy.get('button[type="submit"]').click();

      // Verificar que aparezca un mensaje de error de contraseña débil
      cy.get('body').should('contain.text', 'is shorter than the minimum allowed length (7)');
      
      // Verificar que no se haya redirigido
      cy.url().should('include', 'addUser');
    });

    it('verifica que el formulario no se envíe con campos vacíos', () => {
      // Intentar enviar el formulario sin llenar nada
      cy.get('button[type="submit"]').click();
      
      // Verificar que aparezcan múltiples mensajes de error
      cy.get('body').should('contain.text', 'User validation failed');
      
      // Verificar que no se haya redirigido
      cy.url().should('include', 'addUser');
    });
  });

  describe('Registro de usuario - casos positivos', () => {
    beforeEach(() => {
      cy.visit('https://thinking-tester-contact-list.herokuapp.com/');
      cy.get('button').contains(/^Sign up$/i).click();
    });

    it('registra un usuario exitosamente con datos válidos', () => {
      const unique = Date.now();
      const email = `mati_${unique}@example.com`;
      
      // Llenar todos los campos con datos válidos
      cy.get('#firstName').type('Matias');
      cy.get('#lastName').type('Mann');
      cy.get('#email').type(email);
      cy.get('#password').type('Abcdef1!');
      
      cy.get('button[type="submit"]').click();

      // Verificar que se haya redirigido a la página de contactos
      cy.url().should('include', '/contactList');
      
      // Verificar que aparezca un mensaje de éxito o la página de contactos
      cy.get('body').should('contain.text', 'Contact');
    });

    it('registra un usuario con email válido y contraseña fuerte', () => {
      const unique = Date.now();
      const email = `test_${unique}@gmail.com`;
      
      // Llenar formulario con email válido y contraseña fuerte
      cy.get('#firstName').type('Juan');
      cy.get('#lastName').type('Perez');
      cy.get('#email').type(email);
      cy.get('#password').type('MySecure123!');
      
      cy.get('button[type="submit"]').click();

      // Verificar que se haya redirigido exitosamente
      cy.url().should('not.include', 'addUser');
      cy.url().should('include', '/contactList');
    });

    it('registra un usuario con nombres largos', () => {
      const unique = Date.now();
      const email = `longname_${unique}@example.com`;
      
      // Llenar formulario con nombres largos
      cy.get('#firstName').type('Alejandro Fernando');
      cy.get('#lastName').type('Gonzalez Rodriguez');
      cy.get('#email').type(email);
      cy.get('#password').type('StrongPass456!');
      
      cy.get('button[type="submit"]').click();

      // Verificar que se haya registrado exitosamente
      cy.url().should('include', '/contactList');
    });

    it('registra un usuario con email corporativo', () => {
      const unique = Date.now();
      const email = `usuario_${unique}@empresa.com.ar`;
      
      // Llenar formulario con email corporativo
      cy.get('#firstName').type('Carlos');
      cy.get('#lastName').type('Lopez');
      cy.get('#email').type(email);
      cy.get('#password').type('CorpPass789!');
      
      cy.get('button[type="submit"]').click();

      // Verificar que se haya registrado exitosamente
      cy.url().should('include', '/contactList');
    });

    it('verifica que los campos se llenen correctamente', () => {
      const unique = Date.now();
      const email = `verify_${unique}@test.com`;
      
      // Llenar cada campo individualmente y verificar
      cy.get('#firstName').type('Verificar');
      cy.get('#firstName').should('have.value', 'Verificar');
      
      cy.get('#lastName').type('Campos');
      cy.get('#lastName').should('have.value', 'Campos');
      
      cy.get('#email').type(email);
      cy.get('#email').should('have.value', email);
      
      cy.get('#password').type('TestPass123!');
      cy.get('#password').should('have.value', 'TestPass123!');
      
      // Enviar formulario
      cy.get('button[type="submit"]').click();
      
      // Verificar registro exitoso
      cy.url().should('include', '/contactList');
    });
  });
  
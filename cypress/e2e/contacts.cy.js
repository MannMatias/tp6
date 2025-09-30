// cypress/e2e/contacts.cy.js
describe("Edición de contacto", () => {
  beforeEach(() => {
    // Registrar y loguear un usuario nuevo para cada prueba
    const user = {
      firstName: "Test",
      lastName: "User",
      email: `qa+${Date.now()}@example.com`,
      password: "Passw0rd!",
    };

    cy.visit("https://thinking-tester-contact-list.herokuapp.com/");

    cy.get("button")
      .contains(/^Sign up$/i)
      .click();

    cy.get("#firstName").type(user.firstName);
    cy.get("#lastName").type(user.lastName);
    cy.get("#email").type(user.email);
    cy.get("#password").type(user.password);
    cy.get('button[type="submit"]').click();

    // Validar que estamos dentro de la app
    cy.url().should("include", "/contactList");
    cy.get("body").should("contain.text", "Contact");
  });

  it("edita un contacto existente y refleja cambios en la lista", () => {
    // 1) Crear contacto inicial
    cy.get("#add-contact").click();
    cy.get("#firstName").type("Carlos");
    cy.get("#lastName").type("Pérez");
    cy.get('button[type="submit"]').click();

    // Validar que aparece en la lista
    cy.contains("Carlos Pérez").should("be.visible");

    // 2) Seleccionar contacto y editarlo
    cy.contains("Carlos Pérez").click();
    cy.get("#edit-contact").click();

    // Esperar 2 segundos antes de la edición
    cy.wait(1000);

    // Cambiar valores
    cy.get("#firstName").click().type("{selectall}{backspace}Carla");
    cy.get("#lastName").click().type("{selectall}{backspace}Gómez");
    cy.get("#email").click().type("{selectall}{backspace}carla@example.com");

    // Guardar cambios
    cy.get('button[type="submit"]').click();

    // 3) Validar que los cambios se reflejen en la lista (AC2)
    // Navegar de vuelta a la lista de contactos
    cy.get("#return").click();
    cy.contains("Carla Gómez").should("be.visible");
    cy.contains("Carlos Pérez").should("not.exist");

    // 4) Validar que FirstName y LastName siguen presentes (AC3)
    cy.contains("Carla").should("exist");
    cy.contains("Gómez").should("exist");
  });
});

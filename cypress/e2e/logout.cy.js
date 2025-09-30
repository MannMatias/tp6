/// <reference types="cypress" />

const WEB_URL = "https://thinking-tester-contact-list.herokuapp.com";
const API_BASE = "https://thinking-tester-contact-list.herokuapp.com";
const EP_USERS = `${API_BASE}/users`;

const sel = {
  email: "#email",
  password: "#password",
  submit: "#submit",
  header: "h1",
  logout: "#logout",
};

describe("US-9: Logout", () => {
  const now = Date.now();
  const EMAIL = `qa.logout.${now}@example.com`;
  const PASS = "Demo1234!";

  before(() => {
    cy.request({
      method: "POST",
      url: EP_USERS,
      failOnStatusCode: false,
      body: {
        firstName: "QA",
        lastName: "Logout",
        email: EMAIL,
        password: PASS,
      },
    });
  });

  const uiLogin = () => {
    cy.visit(WEB_URL);
    cy.get(sel.email).type(EMAIL);
    cy.get(sel.password).type(PASS);
    cy.get(sel.submit).click();
    cy.url().should("include", "/contactList");
    cy.contains(sel.header, /contact list/i).should("be.visible");
    cy.get(sel.logout).should("be.visible");
  };

  it("AC1 + AC2: muestra logout y al clickear me saca de la sesión", () => {
    uiLogin();
    cy.get(sel.logout).click();
    cy.url().should("include", "/logout");
  });

  it("AC3: después de logout no vuelvo a ver la lista de contactos", () => {
    uiLogin();
    cy.get(sel.logout).click();
    cy.go("back");
    cy.contains(sel.header, /contact list/i).should("not.exist");
  });

G
});

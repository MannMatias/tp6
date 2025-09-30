/// <reference types="cypress" />

const API_BASE = "https://thinking-tester-contact-list.herokuapp.com";

describe("US-8: Restricción de acceso sin autenticación", () => {

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("AC1: GET /contacts sin token devuelve 401", () => {
    cy.request({
      method: "GET",
      url: `${API_BASE}/contacts`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.body).to.have.property("error");
    });
  });

  it("AC2: GET /users/me sin token devuelve 401", () => {
    cy.request({
      method: "GET",
      url: `${API_BASE}/users/me`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.body).to.have.property("error");
    });
  });

  it("Extra: POST /contacts sin token devuelve 401", () => {
    cy.request({
      method: "POST",
      url: `${API_BASE}/contacts`,
      failOnStatusCode: false,
      body: {
        firstName: "QA",
        lastName: "Test",
        email: "qa@example.com"
      }
    }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.body).to.have.property("error");
    });
  });

  it("Extra: DELETE /contacts/:id sin token devuelve 401", () => {
    cy.request({
      method: "DELETE",
      url: `${API_BASE}/contacts/1234567890`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("Extra: POST /users/logout sin token devuelve 401", () => {
    cy.request({
      method: "POST",
      url: `${API_BASE}/users/logout`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

});

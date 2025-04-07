describe("CoinSight App", () => {
  const testEmail = `cypress_${Date.now()}@example.com`;
  const testPassword = "Cypress@123";

  it("Đăng ký tài khoản mới", () => {
    cy.visit("/auth/register");
    cy.get("[data-testid=name-input]").type("Cypress Test User");
    cy.get("[data-testid=email-input]").type(testEmail);
    cy.get("[data-testid=password-input]").type(testPassword);
    cy.get("[data-testid=register-button]").click();
    cy.url().should("include", "/dashboard");
  });

  it("Đăng nhập và xem dashboard", () => {
    cy.visit("/auth/login");
    cy.get("[data-testid=email-input]").type(testEmail);
    cy.get("[data-testid=password-input]").type(testPassword);
    cy.get("[data-testid=login-button]").click();
    cy.url().should("include", "/dashboard");
    cy.contains("Dashboard").should("be.visible");
  });

  it("Thêm giao dịch mới", () => {
    cy.login(testEmail, testPassword); // Custom command
    cy.visit("/transactions");
    cy.get("[data-testid=add-transaction]").click();
    cy.get("[data-testid=description-input]").type("Mua sắm Cypress");
    cy.get("[data-testid=amount-input]").type("150000");
    cy.get("[data-testid=category-select]").select("shopping");
    cy.get("[data-testid=submit-transaction]").click();
    cy.contains("Mua sắm Cypress").should("be.visible");
  });
});

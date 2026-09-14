import { LoginPage } from "@/pages/Login";
import { mockUseInternetIdentity } from "@/test/render";
import { renderWithRouter } from "@/test/render";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("LoginPage", () => {
  it("renders the nature-themed login with branding and a centered modal", async () => {
    mockUseInternetIdentity({ isAuthenticated: false });
    await renderWithRouter(<LoginPage />);

    // Branding overlay
    expect(screen.getByText("AgriVision Pro")).toBeInTheDocument();
    expect(screen.getByText("For Sustainable Development")).toBeInTheDocument();

    // Centered login modal
    expect(
      screen.getByRole("heading", { name: "Welcome back" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign in with Internet Identity" }),
    ).toBeInTheDocument();
  });

  it("calls login when the form is submitted", async () => {
    const user = userEvent.setup();
    const login = vi.fn();
    mockUseInternetIdentity({ isAuthenticated: false, login });
    await renderWithRouter(<LoginPage />);

    await user.type(screen.getByLabelText("Username"), "arthur");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    expect(login).toHaveBeenCalled();
  });

  it("navigates to the dashboard when already authenticated", async () => {
    mockUseInternetIdentity({ isAuthenticated: true });
    await renderWithRouter(<LoginPage />);

    // When authenticated the page redirects away from the login form.
    expect(
      screen.queryByRole("heading", { name: "Welcome back" }),
    ).not.toBeInTheDocument();
  });
});

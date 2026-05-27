class AuthConfig {
  constructor() {
    this.token = localStorage.getItem("Token");
    this.updateNavBar();
  }

  updateNavBar() {
    const navBar = document.getElementById("navbar");
    if (!navBar) return;

    if (this.token) {
      // logado

      const LogoutLi = document.createElement("li");
      LogoutLi.innerHTML = `<a href="#" id="logout-btn">Sair</a>`;
      navBar.appendChild(LogoutLi);

      const logoutBtn = document.getElementById("logout-btn");

      if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.logOut();
        });
      }
    } else {
      const LogIn = document.createElement("li");
      LogIn.innerHTML = `<a href="login.html">Entrar</a>`;
      navBar.appendChild(LogIn);
    }
  }

  logOut() {
    localStorage.removeItem("Token");
    window.location.reload();
    // recarrega pagina - att menu
  }
}

const authConfig = new AuthConfig();

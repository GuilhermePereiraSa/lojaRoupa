class AuthConfig {
  constructor() {
    this.token = localStorage.getItem("Token");
    this.payload = this.decodeToken(this.token);
    this.updateNavBar();
  }

  decodeToken(token) {
    if (!token) return null;
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Token inválido");
      return null;
    }
  }

  updateNavBar() {
    const navBar = document.getElementById("navbar");
    if (!navBar) return;

    if (this.token && this.payload) {
      if (this.payload.isAdmin === true) {
        const AdminLi = document.createElement("li");
        // Caminho absoluto com barra
        AdminLi.innerHTML = `<a href="/frontend/pages/admin.html">Painel Admin</a>`;
        navBar.appendChild(AdminLi);
      }

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
      // Caminho absoluto com barra
      LogIn.innerHTML = `<a href="/frontend/pages/login.html">Entrar</a>`;
      navBar.appendChild(LogIn);
    }
  }

  logOut() {
    localStorage.removeItem("Token");
    // Caminho absoluto para o redirecionamento funcionar em qualquer tela
    window.location.href = "/frontend/pages/login.html";
  }
}

const authConfig = new AuthConfig();

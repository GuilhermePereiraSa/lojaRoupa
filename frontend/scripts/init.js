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

    // Identifica o ícone do carrinho para inserir os novos botões ANTES dele
    const cartIcon = navBar.querySelector(".ri-shopping-bag-line");
    const cartLi = cartIcon ? cartIcon.closest("li") : null;

    // Verifica qual é o caminho atual da página para definir o link 'active'
    const currentPath = window.location.pathname;

    if (this.token && this.payload) {
      // 1. Adiciona o botão de Perfil
      const PerfilLi = document.createElement("li");
      const isProfileActive =
        currentPath.includes("profile.html") ||
        currentPath.includes("changePassword.html")
          ? 'class="active"'
          : "";
      PerfilLi.innerHTML = `<a ${isProfileActive} href="/pages/profile.html">Meu Perfil</a>`;

      if (cartLi) navBar.insertBefore(PerfilLi, cartLi);
      else navBar.appendChild(PerfilLi);

      // 2. Adiciona o Painel Admin (se tiver permissão)
      if (this.payload.isAdmin === true) {
        const AdminLi = document.createElement("li");
        const isAdminActive = currentPath.includes("admin.html")
          ? 'class="active"'
          : "";
        AdminLi.innerHTML = `<a ${isAdminActive} href="/pages/admin.html">Painel Admin</a>`;

        if (cartLi) navBar.insertBefore(AdminLi, cartLi);
        else navBar.appendChild(AdminLi);
      }

      // 3. Adiciona o botão de Sair
      const LogoutLi = document.createElement("li");
      LogoutLi.innerHTML = `<a href="#" id="logout-btn">Sair</a>`;

      if (cartLi) navBar.insertBefore(LogoutLi, cartLi);
      else navBar.appendChild(LogoutLi);

      // Lógica de terminar sessão
      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.logOut();
        });
      }
    } else {
      // 4. Mostra o Entrar se NÃO tiver sessão iniciada
      const LogIn = document.createElement("li");
      const isLoginActive = currentPath.includes("login.html")
        ? 'class="active"'
        : "";
      LogIn.innerHTML = `<a ${isLoginActive} href="/pages/login.html">Entrar</a>`;

      if (cartLi) navBar.insertBefore(LogIn, cartLi);
      else navBar.appendChild(LogIn);
    }
  }

  logOut() {
    localStorage.clear();
    // Caminho absoluto para o redirecionamento funcionar em qualquer ecrã
    window.location.href = "/pages/login.html";
  }
}

const authConfig = new AuthConfig();

// Setup mobile menu toggle
function setupMobileMenu() {
  const header = document.getElementById("header");
  const navBar = document.getElementById("navbar");
  if (!header || !navBar) return;

  if (!document.getElementById("menu-toggle")) {
    const btn = document.createElement("button");
    btn.id = "menu-toggle";
    btn.setAttribute("aria-label", "Toggle menu");
    btn.innerHTML = "&#9776;"; // hamburger
    header.appendChild(btn);

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      navBar.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!header.contains(e.target) && navBar.classList.contains("open")) {
        navBar.classList.remove("open");
      }
    });

    navBar
      .querySelectorAll("a")
      .forEach((a) =>
        a.addEventListener("click", () => navBar.classList.remove("open")),
      );
  }
}

setupMobileMenu();

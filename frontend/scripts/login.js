class Login {
  constructor(form, fields) {
    this.form = form;
    this.fields = fields;

    this.validationSubmit();
  }

  validationSubmit() {
    let self = this;

    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();

      var error = 0;

      self.fields.forEach((field) => {
        const input = document.querySelector(`#${field}`);
        if (self.validateFields(input) == false) {
          error++;
        }
      });

      if (error == 0) {
        // CORREÇÃO 1: Removido os parênteses de value
        const username = document.querySelector("#username").value;
        const password = document.querySelector("#password").value;

        try {
          const response = await fetch("http://localhost:3001/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
          });

          const data = await response.json();

          if (response.ok) {
            localStorage.setItem("Token", data.token);

            const redirectUrl =
              localStorage.getItem("redirectAfterLogin") || "shop.html";
            localStorage.removeItem("redirectAfterLogin");

            window.location.href = redirectUrl;
          } else {
            alert(`Erro no Login: ${data.message}`);
          }
        } catch (err) {
          console.error("Erro ao conectar ao servidor:", err);
          alert("Não foi possível conectar ao back-end.");
        }
      }
    });
  }

  validateFields(field) {
    if (field.value.trim() == "") {
      this.setStatus(
        field,
        `${field.previousElementSibling.innerText} cannot be blank`,
        "error",
      );
      return false; // Faltava retornar false aqui para bloquear o erro
    } else {
      if (field.type == "password") {
        if (field.value.length < 8) {
          this.setStatus(
            field,
            `${field.previousElementSibling.innerText} deve ter 8 caracteres`,
            "error",
          );
          return false; // Faltava retornar false aqui
        } else {
          this.setStatus(field, null, "sucess");
          return true;
        }
      } else {
        this.setStatus(field, null, "sucess");
        return true;
      }
    }
  }

  setStatus(field, message, status) {
    const errorMessage = field.parentElement.querySelector(".error-message");

    if (status == "sucess") {
      if (errorMessage) {
        // CORREÇÃO 2: Estava "error.errorMessage.innerText"
        errorMessage.innerText = "";
      }
      field.classList.remove("input-error");
    }

    if (status == "error") {
      if (errorMessage) {
        errorMessage.innerText = message;
      }
      field.classList.add("input-error");
    }
  }
}

const form = document.querySelector(".loginForm");

if (form) {
  const fields = ["username", "password"];
  const validator = new Login(form, fields);
}

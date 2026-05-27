class Login {
  constructor(form, fields) {
    this.form = form;
    this.fields = fields;

    this.validationSubmit();
  }

  validationSubmit() {
    let self = this;

    this.form.addEventListener("submit", async (e) => {
      // Adicionado 'async'
      e.preventDefault();

      var error = 0;

      // Executa a sua validação visual de campos
      self.fields.forEach((field) => {
        const input = document.querySelector(`#${field}`);
        if (self.validateFields(input) == false) {
          error++;
        }
      });

      // Se passou na validação do front, dispara a chamada para a API
      if (error == 0) {
        const username = document.querySelector("#username").value();
        const password = document.querySelector("#password").value();

        try {
          const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
          });

          const data = await response.json();

          if (response.ok) {
            // Guarda Token JWT recebido do back-end
            localStorage.setItem("Token", data.token);

            // Verifica se o usuário tentou fechar o carrinho antes de logar
            const redirectUrl =
              localStorage.getItem("redirectAfterLogin") || "shop.html";
            localStorage.removeItem("redirectAfterLogin"); // Limpa o estado

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
    } else {
      if (field.type == "password") {
        if (field.value.length < 8) {
          this.setStatus(
            field,
            `${field.previousElementSibling.innerText} cannot be blank`,
            "error",
          );
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
    // from html
    const errorMessage = field.parentElement.querySelector(".error-message");

    if (status == "sucess") {
      if (errorMessage) {
        error.errorMessage.innerText = "";
      }
      field.classList.remove("input-error");
    }

    if (status == "error") {
      errorMessage.innerText = message;
      field.classList.add("input-error");
    }
  }
}

const form = document.querySelector(".loginForm");

if (form) {
  const fields = ["username", "password"];

  const validator = new Login(form, fields);
}

const form = document.querySelector("#login-form");
const status = document.querySelector("#login-status");
form.onsubmit = async (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  button.disabled = true;
  status.hidden = false;
  status.className = "notice";
  status.textContent = "正在验证…";
  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: form.elements.key.value }),
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || "登录未完成，请重试。");
    form.reset();
    status.textContent = "登录成功，正在打开工作台…";
    window.location.assign("/");
  } catch (error) {
    status.className = "notice error";
    status.textContent =
      error instanceof TypeError
        ? "暂时连不上 CG，请检查服务地址和网络后重试。"
        : error.message;
  } finally {
    button.disabled = false;
  }
};

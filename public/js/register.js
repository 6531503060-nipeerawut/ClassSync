form.addEventListener("submit", () => {
    const register = {
        full_name: full_name.value,
        studentID: studentID.value,
        school: school.value,
        telephone_number: telephone_number.value,
        email: email.value,
        password: password.value
    }

    fetch("/api/register", {
        method: "POST",
        body: JSON.stringify(register),
        headers: {
            "Content-Type": "application/json"
        }
    }).then(res => res.json())
        .then(data => {
            if (data.status == "error") {
                success.style.display = "none"
                error.style.display = "block"
                error.innerText = data.error
            } else {
                error.style.display = "none"
                success.style.display = "block"
                success.innerText = data.success
            }
        })
})
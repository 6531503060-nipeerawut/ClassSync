document.getElementById("join-btn").addEventListener("click", async() => {
    const courseCode = document.getElementById("courseCode").value;
    const coursePassword = document.getElementById("coursePassword").value;

    const data = {
        courseCode: courseCode,
        coursePassword: coursePassword
    }

    const response = await fetch("/s/home", {
        method: "post",
        headers: {"Content-Type": "application/json"},
        body:JSON.stringify(data)
    })

    if(response.ok) {
        const result = response.json()
        console.log(result)
    } else {
        const result = response.json()
        console.log(result)
    }
})
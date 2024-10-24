/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                background: {
                    100: "#E2E7EB",
                    200: "#BFBFBF",
                    500: "#848484",
                    800: "#303030",
                },
                primary: {
                    500: "#020180",
                },
            },
            borderWidth: {
                win: "2px",
            },
        },
    },
    plugins: [],
};

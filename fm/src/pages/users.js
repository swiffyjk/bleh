import { page } from '../build/page';
import { markdown } from '../components/markdown';

export function bleh_users() {
    let users = page.structure.main.querySelectorAll('.user-list-about-me');
    users.forEach((user) => {
        let result = markdown(user.textContent, {
            allow_headers: true,
            line_breaks: false
        });
        user.innerHTML = result;
    });
}
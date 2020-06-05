import axios from "axios";
import { $ } from "./bling";

function ajaxHeart(e) {
  e.preventDefault();

  console.log("hearttt");

  axios
    .post(this.action)
    .then((res) => {
      const hearted = this.heart.classList.toggle("heart__button--hearted");
      $(".heart-count").textContent = res.data.hearts.length;

      if (hearted) {
        this.heart.classList.add("heart__button--float");

        setTimeout(
          () => this.heart.classList.remove("heart__button--float"),
          2500
        );
      }
    })
    .catch();
}

export default ajaxHeart;

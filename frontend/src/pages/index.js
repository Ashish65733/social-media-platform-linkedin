import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useRouter } from "next/router"; 

export default function Home() {
  const router = useRouter();
  return (
    <>
      <div className={styles.container}>
        <div className={styles.mainContainer}>
          <div className={styles.mainContainer__left}>
           <p>Connect with Friends without exaggeration</p>
           <p>A true social media platform, with stories no blufs !</p>
            <button onClick={() => { router.push("/login") }} className={styles.buttonJoin}>Join Now</button>
          </div>
          <div className={styles.mainContainer__right}>
            <img src="images/Connection.jpg" alt="" />
          </div>
        </div>
      </div>
    </>
  );
}

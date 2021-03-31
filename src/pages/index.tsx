import { GetStaticProps } from 'next';
import Head from 'next/head'
import Link from 'next/link'

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client'
import { RichText } from 'prismic-dom'
import { format } from 'date-fns'


import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { FiCalendar, FiUser} from 'react-icons/fi'
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({postsPagination} : HomeProps) {

  const [postsList, setPostsList] = useState(postsPagination)

  async function handleLoadNextPage() {
    
    fetch(postsPagination.next_page)
    .then(res => res.json())
    .then(data => {
      const newResults = data.results.map(post => {
        return {
          uid: post.uid,  
          first_publication_date: post.first_publication_date,
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author
          }
        }
      })

      const newNextPage = data.next_page

      setPostsList({
        results: postsList.results.concat(newResults),
        next_page: newNextPage
      })

    })
    
  }

  return (
    <>
      <Head>
        <title>Home | spacetravelling</title>
      </Head>
      <main className={commonStyles.container}>
        <section className={styles.contentContainer} >
          <Link href="/">
            <img src="/images/logo.svg" alt="logo"/>
          </Link>
          <main>
            {
              postsList.results.map(post => (
                <Link key={post.uid} href={`/post/${post.uid}`}>
                  <a>
                    <strong>{post.data.title}</strong>
                    <p >{post.data.subtitle}</p>
                    <div className={commonStyles.postInfo}>
                      <FiCalendar />
                      <span>{format(new Date(post.first_publication_date), 'dd MMM yyyy' ,{locale: ptBR})}</span>
                      <FiUser />
                      <span>{post.data.author}</span>
                    </div>
                  </a>
                </Link>
              ))
            }
          </main>
          {
            postsList.next_page && (
              <button
                onClick={handleLoadNextPage}
              >
                Carregar mais posts
              </button>
            )
          }
        </section>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'p1')
  ], {
    fetch: ['p1.title', 'p1.subtitle', 'p1.content', 'p1.author', 'p1.banner'],
    pageSize: 2
  });

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,  
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  console.log(results)

  const next_page = postsResponse.next_page

  return {
    props: {
      postsPagination : {
        next_page,
        results
      }
    },
    revalidate: 60 * 60 * 24 // 24 hours
  }
};

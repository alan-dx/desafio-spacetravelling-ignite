import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client'


import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post}: PostProps) {

  const router = useRouter()
  const [readTime, setReadTime] = useState(0)

  useEffect(() => {
    let headingWords = 0
    let bodyWords = 0

    if (!router.isFallback) {
      post.data.content.forEach((content) => {
        
        headingWords = headingWords + content.heading.match(/\S+/g).length
        bodyWords = bodyWords + content.body['text'].match(/\S+/g).length
  
      })
  
      setReadTime(Math.ceil((headingWords + bodyWords) / 200))
    }

  }, [router.isFallback, post])

  return (
    <>
      <Head>
        <title>Post | spacetravelling</title>
      </Head>
      <Header />
      {
        router.isFallback ?
        <main className={commonStyles.container}>
          <strong>Carregando...</strong>
        </main>
        :
        <>
          <img className={styles.banner} src={post.data.banner.url} alt="post image"/>
          <main className={commonStyles.container}>
            <article className={styles.postContent}>
              <strong>{post.data.title}</strong>
              <header className={commonStyles.postInfo}>
              <FiCalendar />
                <span>{format(new Date(post.first_publication_date), 'dd MMM yyyy' ,{locale: ptBR})}</span>
                <FiUser />
                <span>{post.data.author}</span>
                <FiClock />
                <span>{readTime} min</span>
              </header>

              <main>
                {post.data.content.map(content => (
                  <section key={content.heading}>
                    <strong>{content.heading}</strong>
                    <div 
                      dangerouslySetInnerHTML={{__html: content.body['text']}}
                      className={styles.postBody}
                    />
                  </section>
                ))}
              </main>

            </article>
          </main>
        </>
      }
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  
  const prismic = getPrismicClient();
  
  const { results } = await prismic.query([
    Prismic.predicates.at('document.type', 'p1')
  ], {
    fetch: [],
    pageSize: 2
  });

  const paths = results.map(result => {
    return {
      params: { slug: result.uid }
    }
  })

  return {
    paths,
    fallback: true
  }

};

export const getStaticProps: GetStaticProps = async context => {

  const { slug } = context.params

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('p1', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: response.data.content.map((content: any) => {

        return {
          heading: content.heading,
          body: {
            text: RichText.asHtml(content.body)
          }
        }

      })
    }
  }

  return {
    props: {
      post
    }
  }
};

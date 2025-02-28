import { database } from '@magickml/database'
import { OPENAI_API_KEY } from '@magickml/server-config'
import { tts, tts_tiktalknet } from '@magickml/systems'
import Koa from 'koa'
import { Route } from './types'
import { CustomError } from './utils/CustomError'
import { makeCompletion } from './utils/MakeCompletionRequest'
import { MakeModelRequest } from './utils/MakeModelRequest'
import { queryGoogleSearch } from './utils/queryGoogle'

export const modules: Record<string, unknown> = {}

const getTextToSpeech = async (ctx: Koa.Context) => {
  const text = ctx.request.query.text as string
  let character = ctx.request.query.character ?? 'none'
  console.log('text and character are', text, character)
  const voice_provider = ctx.request.query.voice_provider as string
  const voice_character = ctx.request.query.voice_character as string
  const tiktalknet_url = ctx.request.query.tiktalknet_url as string

  console.log('text and character are', text, voice_character)

  let url = ''

  //@ts-ignore
  if (!cache && cache.length <= 0) {
    if (voice_provider === 'google') {
      url = await tts(text, voice_character as string)
    } else {
      url = await tts_tiktalknet(text, voice_character, tiktalknet_url)
    }
  }

  console.log('stt url:', url)

  return (ctx.body = url)
}

const textCompletion = async (ctx: Koa.Context) => {
  const {
    modelName,
    temperature,
    maxTokens,
    topP,
    frequencyPenalty,
    presencePenalty,
    sender,
    prompt,
    stop,
    apiKey: _apiKey,
  } = ctx.request.body

  let apiKey = _apiKey ?? OPENAI_API_KEY

  if (!apiKey)
    throw new CustomError('authentication-error', 'No API key provided')

  const { success, choice } = await makeCompletion(modelName, {
    prompt: prompt.trim(),
    temperature,
    max_tokens: maxTokens,
    top_p: topP,
    frequency_penalty: frequencyPenalty,
    presence_penalty: presencePenalty,
    stop,
    apiKey,
  })

  return (ctx.body = { success, choice })
}

const hfRequest = async (ctx: Koa.Context) => {
  const inputs = ctx.request.body.inputs as string
  const model = ctx.request.body.model as string
  const parameters = ctx.request.body.parameters as any
  const options = (ctx.request.body.options as any) || {
    use_cache: false,
    wait_for_model: true,
  }

  const { success, data } = await MakeModelRequest(
    inputs,
    model,
    parameters,
    options
  )

  return (ctx.body = { succes: success, data: data })
}

// const makeWeaviateRequest = async (ctx: Koa.Context) => {
//   const keyword = ctx.request.body.keyword as string

//   const client = weaviate.client({
//     scheme: 'http',
//     host: 'semantic-search-wikipedia-with-weaviate.api.vectors.network:8080/',
//   })

//   const res = await client.graphql
//     .get()
//     .withNearText({
//       concepts: [keyword],
//       certainty: 0.75,
//     })
//     .withClassName('Paragraph')
//     .withFields('title content inArticle { ... on Article {  title } }')
//     .withLimit(3)
//     .do()

//   console.log('RESPONSE', res)

//   if (res?.data?.Get !== undefined) {
//     return (ctx.body = { data: res.data.Get })
//   }
//   return (ctx.body = { data: '' })
// }

const getAgentsInfo = async (ctx: Koa.Context) => {
  const id = (ctx.request.query.id as string)
    ? parseInt(ctx.request.query.id as string)
    : -1

  try {
    let data = await database.getAgents()
    let info = undefined
    for (let i = 0; i < data.length; i++) {
      if (data[i].id === id) {
        info = data[i]
      }
    }

    return (ctx.body = info)
  } catch (e) {
    console.log('getAgentsHandler:', e)
    ctx.status = 500
    return (ctx.body = { error: 'internal error' })
  }
}

const queryGoogle = async (ctx: Koa.Context) => {
  console.log('QUERY', ctx.request?.body?.query)
  if (!ctx.request?.body?.query)
    throw new CustomError('input-failed', 'No query provided in request body')
  const query = ctx.request.body?.query as string
  const data = await queryGoogleSearch(query)
  console.log('DATA', data)
  const { summary, links } = data
  console.log('SUMMARY', summary)
  console.log('LINKS', links)
  return (ctx.body = { summary, links })
}

const image_generation = async (ctx: Koa.Context) => {
  const url = 'http://localhost:7860/sdapi/v1/txt2img'

  // proxy the request to the url and then return the respons
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ctx.request.body),
  })

  const data = await response.json()
  ctx.body = data
}

export const apis: Route[] = [
  {
    path: '/text_to_speech',
    get: getTextToSpeech,
  },
  {
    path: '/text_completion',
    post: textCompletion,
  },
  {
    path: '/hf_request',
    post: hfRequest,
  },
  // {
  //   path: '/weaviate',
  //   post: makeWeaviateRequest,
  // },
  {
    path: '/query_google',
    post: queryGoogle,
  },
  {
    path: '/image_generation',
    post: image_generation,
  },
]

import React, { useState, useRef, useContext } from 'react'
import Link from 'next/link'
import { Avatar } from './login'
import { showTimeAgo } from './comments'
import type { FormEvent } from 'react'
import { Task, File, User, BackendContext } from './types'
import { Upload } from './icons'
import Image from 'next/image'

function showFileSize(size: number) {
  if (size < 1024) return `${Math.round(size)} B`
  const kb = size / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${Math.round(mb)} MB`
  const gb = kb / 1024
  return `${Math.round(gb)} GB`
}

function showFileType(type: string) {
  switch (type.split('/')[0]) {
    case 'image':
      return '🖼️'
    case 'video':
      return '📼'
    case 'text':
      return '📄'
    default:
      return '📎'
  }
}

function FileListing({
  file,
  user,
  handleDeleteFile,
}: {
  file: File
  user?: User | null
  handleDeleteFile: (id: string) => void
}) {
  const { id, creationTime, name, type, author, url, size } = file
  const created = new Date(creationTime)
  const isFileAuthor = user && user.id == author.id
  return (
    <li key={id.toString()} className="file">
      <div
        style={{
          width: '90%',
          marginRight: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          overflowWrap: 'anywhere',
        }}
      >
        <div style={{ flexGrow: 2, marginRight: '16px' }}>
          <span>{showFileType(type)}</span>
          <Link href={url} target="_blank">
            {name}
          </Link>
          <span> ({showFileSize(size)})</span>
        </div>
        <div style={{ flexShrink: 0 }}>
          {isFileAuthor && (
            <button
              className="icon-button"
              title="Delete file"
              onClick={() => handleDeleteFile(id)}
            >
              🗑️
            </button>
          )}
          {/* <button className="icon-button" title="Download file">
            ⬇️
          </button> */}
        </div>
      </div>
      <span>
        <Avatar user={author} size={20} />
      </span>
      <span title={created.toLocaleString()}>{showTimeAgo(created)}</span>
    </li>
  )
}

function FilePreviews({ files, user }: { files: File[]; user?: User | null }) {
  return (
    <div className="flex-col">
      <div id="file-previews">
        {files.map((f, i) => (
          <div key={i} className="file-preview">
            <Image src={f.url} alt={f.name} fill />
          </div>
        ))}
      </div>
    </div>
  )
}

function FileUploading({
  fileName,
  fileType,
  author,
}: {
  fileName: string
  fileType: string
  author: User
}) {
  return (
    <li key={fileName} className="file">
      <div
        style={{
          width: '90%',
          marginRight: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          overflowWrap: 'anywhere',
        }}
      >
        <div style={{ flexGrow: 2, marginRight: '16px' }}>
          <span>{showFileType(fileType)}</span>
          <Link href={'#'}>{fileName}</Link>
          <span> (uploading...)</span>
        </div>
        <div style={{ flexShrink: 0 }}></div>
      </div>
      <span>
        <Avatar user={author} size={20} />
      </span>
      <span>...</span>
    </li>
  )
}
export function Files({
  user,
  task,
}: {
  user?: User | null
  task: Task
}) {
  const fileHandler = useContext(BackendContext)!.fileHandler;
  const [uploading, setUploading] = useState({ name: '', type: '' })
  const fileInput = useRef<HTMLInputElement>(null)

  const handleDeleteFile = async function (fileId: string) {
    await fileHandler.deleteFile(fileId)
  }

  async function handleUploadFile(event: FormEvent) {
    event.preventDefault()
    const { files } = event.target as HTMLInputElement
    if (!files || files.length !== 1)
      throw new Error('Select exactly one file to upload')

    const newFile = files[0]
    if (fileInput.current) fileInput.current.value = ''

    // we should never end up here, but just in case
    if (!newFile) throw new Error('No file selected for upload')
    setUploading({ name: newFile.name, type: newFile.type })
    fileHandler.uploadFile(newFile).finally(() => {
      setUploading({ name: '', type: '' })
    })
  }

  // TODO temporary fix for only displaying image files, although other files can be uploaded
  const imageFiles = task?.files?.filter((f) => f.type.startsWith('image'))
  const [visibleIndex, setVisibleIndex] = useState(5)
  const visibleFiles = imageFiles?.slice(0, visibleIndex)
  const moreFiles = imageFiles?.length - visibleFiles?.length

  if (!task) return null

  return (
    <div id="files">
      <div id="files-header">
        <h4>Files ({imageFiles?.length || 0})</h4>
        <button id="file-upload">
          {/* TODO open upload modal */}
          <Upload /> Upload
        </button>
        {/* {user && (
          <form
            style={{
              display: 'flex',
              justifyContent: 'left',
              margin: '8px 16px',
            }}
          >
            <label htmlFor="upload">+ Upload file</label>
            <input
              id="upload"
              type="file"
              style={{ opacity: 0 }}
              onChange={handleUploadFile}
              ref={fileInput}
            />
          </form>
        )} */}
      </div>
      {visibleFiles && <FilePreviews files={visibleFiles} user={user} />}
      {moreFiles > 0 && (
        <div id="more-files">
          <button
            className="more-button"
            onClick={() => setVisibleIndex(task.files.length)}
          >
            + {moreFiles} more
          </button>
        </div>
      )}
    </div>
  )
}

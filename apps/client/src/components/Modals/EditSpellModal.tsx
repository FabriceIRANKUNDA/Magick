import { useState } from 'react'
import { useSnackbar } from 'notistack'
import { usePatchSpellMutation } from '../../state/api/spells'
import { useForm } from 'react-hook-form'
import Modal from '../Modal/Modal'
import css from './modalForms.module.css'
import { closeTab, openTab } from '../../state/tabs'
import { useDispatch } from 'react-redux'

const EditSpellModal = ({ closeModal, spellId, name, tab }) => {
  const [error, setError] = useState('')
  const [patchSpell, { isLoading }] = usePatchSpellMutation()
  const { enqueueSnackbar } = useSnackbar()
  const dispatch = useDispatch()

  const {
    register,
    handleSubmit,
    // formState: { errors },
  } = useForm()
  console.log('tab ::: ', tab)

  const onSubmit = handleSubmit(async data => {
    const response: any = await patchSpell({
      spellId: tab.spellId,
      update: data,
    })

    if (response.error) {
      setError(response.error.data.error.message)
      enqueueSnackbar('Error saving spell', {
        variant: 'error',
      })
      return
    }

    enqueueSnackbar('Spell saved', { variant: 'success' })

    dispatch(closeTab(tab.id))
    dispatch(
      openTab({
        name: data.name,
        spellId: data.name,
        type: 'spell',
      })
    )

    closeModal()
  })

  // notes
  // after you save the spell, you need to refetch it?a

  const options = [
    {
      className: `${css['loginButton']} primary`,
      label: 'save',
      onClick: onSubmit,
      disabled: isLoading,
    },
  ]

  return (
    <Modal title="Rename Spell" options={options} icon="info">
      <div className={css['login-container']}>
        {error && <span className={css['error-message']}>{error}</span>}
        <form onSubmit={onSubmit}>
          {/* register your input into the hook by invoking the "register" function */}
          <div className={css['input-container']}>
            <label className={css['label']} htmlFor="">
              Spell name
            </label>
            <input
              type="text"
              className={css['input']}
              defaultValue={name}
              {...register('name')}
            />
          </div>
          {/* errors will return when field validation fails  */}
          {/* {errors.password && <span>This field is required</span>} */}
        </form>
      </div>
    </Modal>
  )
}

export default EditSpellModal

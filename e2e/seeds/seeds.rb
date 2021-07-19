# frozen_string_literal: true

module Seeds
  def load_preconditions(seed_data)
    public_send(seed_data)
  end
end

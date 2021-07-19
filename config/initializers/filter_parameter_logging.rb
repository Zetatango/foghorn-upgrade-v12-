# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Configure sensitive parameters which will be filtered from the log file.
Rails.application.config.filter_parameters += %i[password email phone_number address_line1 address_line2 address_line_1 address_line_2 middle_initial
                                                 first_name last_name sin city province postal_code area_code date_of_birth suffix annual_income country
                                                 institution_number transit_number account_number]
